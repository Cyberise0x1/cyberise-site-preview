import { Router, type IRouter } from "express";
import fs from "fs/promises";
import path from "path";
import { OrderStatus, Prisma } from "@workspace/db";
import { prisma } from "@workspace/db";
import { deleteInstance } from "../services/linode";
import { deleteCache } from "../services/redis";
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendValidationError,
} from "../utils/responses";
import { requireAuth, attachUser, requireAdmin } from "../middleware/auth";
import { strictRateLimit } from "../middleware/rateLimit";
import { updateSettingsSchema, paginationSchema } from "../validators/admin";
import { logger } from "../lib/logger";
import type { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

router.use(requireAuth, attachUser, requireAdmin);

router.get("/admin/users", async (req: AuthRequest, res) => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error.flatten().fieldErrors);
      return;
    }

    const { page, limit, search } = parsed.data;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { id: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch users");
    sendError(res, "Failed to fetch users");
  }
});

router.patch(
  "/admin/users/:id/ban",
  strictRateLimit,
  async (req: AuthRequest, res) => {
    try {
      const userId = String(req.params.id);

      const user = await prisma.user.update({
        where: { id: userId },
        data: { banned: true },
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.user!.id,
          action: "USER_BANNED",
          entity: "User",
          entityId: userId,
          metadata: { email: user.email },
        },
      });

      sendSuccess(res, user);
    } catch (error) {
      logger.error({ error }, "Failed to ban user");
      sendError(res, "Failed to ban user");
    }
  },
);

router.patch(
  "/admin/users/:id/unban",
  strictRateLimit,
  async (req: AuthRequest, res) => {
    try {
      const userId = String(req.params.id);

      const user = await prisma.user.update({
        where: { id: userId },
        data: { banned: false },
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.user!.id,
          action: "USER_UNBANNED",
          entity: "User",
          entityId: userId,
          metadata: { email: user.email },
        },
      });

      sendSuccess(res, user);
    } catch (error) {
      logger.error({ error }, "Failed to unban user");
      sendError(res, "Failed to unban user");
    }
  },
);

router.get("/admin/orders", async (req: AuthRequest, res) => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error.flatten().fieldErrors);
      return;
    }

    const { page, limit, search } = parsed.data;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { id: { contains: search } },
            { ip: { contains: search } },
            {
              user: {
                email: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    sendSuccess(res, {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch orders");
    sendError(res, "Failed to fetch orders");
  }
});

router.delete(
  "/admin/orders/:id",
  strictRateLimit,
  async (req: AuthRequest, res) => {
    try {
      const orderId = String(req.params.id);

      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        sendNotFound(res, "Order");
        return;
      }

      if (
        order.linodeInstanceId &&
        (order.status === OrderStatus.ACTIVE ||
          order.status === OrderStatus.PENDING)
      ) {
        try {
          await deleteInstance(order.linodeInstanceId);
        } catch (error) {
          logger.warn({ error, orderId }, "Failed to delete Linode instance");
        }
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.TERMINATED,
          terminatedAt: new Date(),
          terminationReason: "Admin action",
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.user!.id,
          action: "ORDER_TERMINATED_ADMIN",
          entity: "Order",
          entityId: orderId,
        },
      });

      sendSuccess(res, updatedOrder);
    } catch (error) {
      logger.error({ error }, "Failed to terminate order");
      sendError(res, "Failed to terminate order");
    }
  },
);

router.get("/admin/settings", async (_req: AuthRequest, res) => {
  try {
    const settings = await prisma.marketSettings.findMany();
    const settingsMap = Object.fromEntries(
      settings.map((s) => [s.key, s.value]),
    );
    sendSuccess(res, settingsMap);
  } catch (error) {
    logger.error({ error }, "Failed to fetch settings");
    sendError(res, "Failed to fetch settings");
  }
});

router.patch(
  "/admin/settings",
  strictRateLimit,
  async (req: AuthRequest, res) => {
    try {
      const parsed = updateSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        sendValidationError(res, parsed.error.flatten().fieldErrors);
        return;
      }

      const updates = Object.entries(parsed.data).map(([key, value]) =>
        prisma.marketSettings.upsert({
          where: { key },
          update: { value: value as Prisma.InputJsonValue },
          create: { key, value: value as Prisma.InputJsonValue },
        }),
      );

      await Promise.all(updates);
      await deleteCache("market:data");

      await prisma.auditLog.create({
        data: {
          actorId: req.user!.id,
          action: "SETTINGS_UPDATED",
          entity: "MarketSettings",
          metadata: { updatedKeys: Object.keys(parsed.data) },
        },
      });

      const settings = await prisma.marketSettings.findMany();
      const settingsMap = Object.fromEntries(
        settings.map((s) => [s.key, s.value]),
      );
      sendSuccess(res, settingsMap);
    } catch (error) {
      logger.error({ error }, "Failed to update settings");
      sendError(res, "Failed to update settings");
    }
  },
);

router.get("/admin/agent-context", async (_req: AuthRequest, res) => {
  try {
    const candidates = [
      path.resolve(process.cwd(), ".agent_context.json"),
      path.resolve(process.cwd(), "../../.agent_context.json"),
    ];
    let content: string | null = null;
    for (const p of candidates) {
      try {
        content = await fs.readFile(p, "utf-8");
        break;
      } catch {}
    }
    if (!content) {
      sendError(res, ".agent_context.json not found");
      return;
    }
    sendSuccess(res, JSON.parse(content));
  } catch (error) {
    logger.error({ error }, "Failed to read agent context");
    sendError(res, "Failed to read agent context");
  }
});

export default router;
