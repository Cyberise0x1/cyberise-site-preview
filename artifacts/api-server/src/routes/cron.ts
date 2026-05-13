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

export default router;
