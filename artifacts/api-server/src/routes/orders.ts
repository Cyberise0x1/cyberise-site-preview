import { Router, type IRouter } from "express";
import { OrderStatus } from "@workspace/db";
import { prisma } from "@workspace/db";
import { deleteInstance } from "../services/linode";
import { deleteProInstance } from "../services/rdpmonster";
import { sendEmail, generateTerminationEmail } from "../services/email";
import { decrypt } from "../utils/encryption";
import { sendSuccess, sendError, sendNotFound } from "../utils/responses";
import { requireAuth, attachUser, requireActiveUser } from "../middleware/auth";
import { strictRateLimit } from "../middleware/rateLimit";
import { orderIdSchema } from "../validators/market";
import { logger } from "../lib/logger";
import type { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

router.get("/orders", requireAuth, attachUser, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    const userIdFilter = req.query.userId as string | undefined;
    const statusFilter = req.query.status as OrderStatus | undefined;

    const where = isAdmin && userIdFilter
      ? { userId: userIdFilter, ...(statusFilter && { status: statusFilter }) }
      : { userId, ...(statusFilter && { status: statusFilter }) };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: isAdmin ? { user: { select: { email: true } } } : undefined,
    });

    const ordersWithDecrypted = orders.map(order => ({
      ...order,
      rdpPassword: order.rdpPasswordEncrypted ? decrypt(order.rdpPasswordEncrypted) : null,
      tier: (order.metadata as Record<string, unknown> | null)?.tier ?? "basic",
    }));

    sendSuccess(res, ordersWithDecrypted);
  } catch (error) {
    logger.error({ error }, "Failed to fetch orders");
    sendError(res, "Failed to fetch orders");
  }
});

router.get("/orders/:id", requireAuth, attachUser, async (req: AuthRequest, res) => {
  try {
    const parsed = orderIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) {
      sendError(res, "Invalid order ID", 400);
      return;
    }

    const userId = req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.id },
      include: isAdmin ? { user: { select: { email: true } } } : undefined,
    });

    if (!order) {
      sendNotFound(res, "Order");
      return;
    }

    if (order.userId !== userId && !isAdmin) {
      sendError(res, "Unauthorized", 403);
      return;
    }

    const orderWithPassword = {
      ...order,
      rdpPassword: order.rdpPasswordEncrypted ? decrypt(order.rdpPasswordEncrypted) : null,
      tier: (order.metadata as Record<string, unknown> | null)?.tier ?? "basic",
    };

    sendSuccess(res, orderWithPassword);
  } catch (error) {
    logger.error({ error }, "Failed to fetch order");
    sendError(res, "Failed to fetch order");
  }
});

router.post("/orders/:id/terminate", requireAuth, attachUser, requireActiveUser, strictRateLimit, async (req: AuthRequest, res) => {
  try {
    const parsed = orderIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) {
      sendError(res, "Invalid order ID", 400);
      return;
    }

    const userId = req.user!.id;

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.id },
    });

    if (!order) {
      sendNotFound(res, "Order");
      return;
    }

    if (order.userId !== userId) {
      sendError(res, "Unauthorized", 403);
      return;
    }

    if (order.status !== OrderStatus.ACTIVE && order.status !== OrderStatus.PENDING) {
      sendError(res, "Order is not active", 400);
      return;
    }

    const metadata = order.metadata as Record<string, unknown> | null;
    const tier = metadata?.tier ?? "basic";

    if (tier === "pro") {
      const proInstanceId = metadata?.proInstanceId as string | undefined;
      if (proInstanceId) {
        try {
          await deleteProInstance(proInstanceId);
        } catch (error) {
          logger.warn({ error, orderId: order.id, proInstanceId }, "Failed to delete Pro instance — DB will still be marked TERMINATED");
        }
      }
    } else {
      if (order.linodeInstanceId) {
        try {
          await deleteInstance(order.linodeInstanceId);
        } catch (error) {
          logger.warn({ error, orderId: order.id }, "Failed to delete Linode instance — DB will still be marked TERMINATED");
        }
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.TERMINATED,
        terminatedAt: new Date(),
        terminationReason: "User requested",
      },
    });

    if (order.ip) {
      const emailContent = generateTerminationEmail({
        ip: order.ip,
        terminatedAt: new Date(),
      });

      await sendEmail({
        to: req.user!.email,
        subject: "RDP Service Terminated - Cyberise",
        html: emailContent.html,
        text: emailContent.text,
        userId,
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "ORDER_TERMINATED",
        entity: "Order",
        entityId: order.id,
      },
    });

    sendSuccess(res, updatedOrder);
  } catch (error) {
    logger.error({ error }, "Failed to terminate order");
    sendError(res, "Failed to terminate order");
  }
});

export default router;
