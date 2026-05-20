import { Router, type IRouter } from "express";
import { OrderStatus } from "@workspace/db";
import { prisma } from "@workspace/db";
import { deleteInstance } from "../services/linode";
import { sendEmail, generateRenewalReminderEmail } from "../services/email";
import { sendSuccess, sendError } from "../utils/responses";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/cron/expire-instances", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const now = new Date();
    const reminderThreshold = new Date();
    reminderThreshold.setDate(reminderThreshold.getDate() + 3);

    const expiredOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.ACTIVE,
        expiresAt: { lt: now },
      },
      include: {
        user: true,
      },
    });

    let terminated = 0;
    for (const order of expiredOrders) {
      try {
        let deleteFailed = false;
        if (order.linodeInstanceId) {
          try {
            await deleteInstance(order.linodeInstanceId);
          } catch (err) {
            logger.error({ err, linodeId: order.linodeInstanceId, orderId: order.id }, "Failed to delete expired Linode instance — instance may be orphaned");
            deleteFailed = true;
          }
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.TERMINATED,
            terminatedAt: now,
            terminationReason: "Expired",
          },
        });

        await prisma.auditLog.create({
          data: {
            actorId: order.userId,
            action: "ORDER_EXPIRED",
            entity: "Order",
            entityId: order.id,
            metadata: deleteFailed ? { linodeOrphaned: true, linodeInstanceId: order.linodeInstanceId } : undefined,
          },
        });

        terminated++;
      } catch (error) {
        logger.error({ error, orderId: order.id }, "Failed to terminate expired order");
      }
    }

    const upcomingExpirations = await prisma.order.findMany({
      where: {
        status: OrderStatus.ACTIVE,
        expiresAt: {
          gt: now,
          lt: reminderThreshold,
        },
      },
      include: {
        user: true,
      },
    });

    let remindersSent = 0;
    for (const order of upcomingExpirations) {
      if (!order.ip || !order.user?.email) continue;

      try {
        const emailContent = generateRenewalReminderEmail({
          ip: order.ip,
          expiresAt: order.expiresAt!,
        });

        await sendEmail({
          to: order.user.email,
          subject: "RDP Renewal Reminder - Cyberise",
          html: emailContent.html,
          text: emailContent.text,
          userId: order.userId,
        });

        remindersSent++;
      } catch (error) {
        logger.error({ error, orderId: order.id }, "Failed to send reminder");
      }
    }

    logger.info({ terminated, remindersSent }, "Cron job completed");

    sendSuccess(res, {
      terminated,
      remindersSent,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error({ error }, "Cron job failed");
    sendError(res, "Cron job failed");
  }
});

router.post("/cron/expire-crypto-payments", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const cutoff = new Date(Date.now() - 60 * 60 * 1000);

    const stalePayments = await prisma.cryptoPayment.findMany({
      where: {
        paymentStatus: { in: ["waiting", "confirming", "partially_paid"] },
        createdAt: { lt: cutoff },
      },
      include: { order: true },
    });

    let expired = 0;
    for (const payment of stalePayments) {
      try {
        if (payment.order.status === OrderStatus.PENDING) {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: OrderStatus.FAILED },
          });
        }

        await prisma.cryptoPayment.update({
          where: { id: payment.id },
          data: { paymentStatus: "expired", completedAt: new Date() },
        });

        await prisma.auditLog.create({
          data: {
            actorId: payment.order.userId,
            action: "CRYPTO_PAYMENT_EXPIRED",
            entity: "Order",
            entityId: payment.orderId,
            metadata: { paymentId: payment.paymentId },
          },
        });

        expired++;
      } catch (error) {
        logger.error({ error, paymentId: payment.id }, "Failed to expire stale crypto payment");
      }
    }

    logger.info({ expired }, "Crypto payment expiry cron complete");

    sendSuccess(res, {
      expired,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, "Crypto payment expiry cron failed");
    sendError(res, "Cron job failed");
  }
});

export default router;
