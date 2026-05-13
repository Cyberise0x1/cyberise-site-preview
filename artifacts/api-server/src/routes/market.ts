import { Router, type IRouter } from "express";
import { OrderStatus } from "@workspace/db";
import { prisma } from "@workspace/db";
import { getPlans, getRegions, getWindowsImages, createInstance, deleteInstance } from "../services/linode";
import { getCache, setCache } from "../services/redis";
import { sendEmail, generateRDPCredentialsEmail } from "../services/email";
import { encrypt, generatePassword } from "../utils/encryption";
import { sendSuccess, sendError, sendValidationError } from "../utils/responses";
import { requireAuth, attachUser, requireActiveUser } from "../middleware/auth";
import { marketRateLimit, orderRateLimit } from "../middleware/rateLimit";
import { createOrderSchema } from "../validators/market";
import { logger } from "../lib/logger";
import type { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

router.get("/market/plans", marketRateLimit, async (_req, res) => {
  try {
    const cached = await getCache<{
      plans: Awaited<ReturnType<typeof getPlans>>;
      regions: Awaited<ReturnType<typeof getRegions>>;
      images: Awaited<ReturnType<typeof getWindowsImages>>;
    }>("market:data");

    if (cached) {
      sendSuccess(res, cached);
      return;
    }

    const settings = await prisma.marketSettings.findMany();
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

    const [plans, regions, images] = await Promise.all([
      getPlans(),
      getRegions(),
      getWindowsImages(),
    ]);

    const enabledRegions = settingsMap.enabled_regions as string[] ?? regions.map(r => r.id);
    const enabledPlans = settingsMap.enabled_plans as string[] ?? plans.map(p => p.id);

    const filteredRegions = regions.filter(r => enabledRegions.includes(r.id));
    const filteredPlans = plans.filter(p => enabledPlans.includes(p.id));

    const markupPercent = settingsMap.markup_percentage as number ?? 20;
    const plansWithPricing = filteredPlans.map(plan => ({
      ...plan,
      price: {
        hourly: Number((plan.price.hourly * (1 + markupPercent / 100)).toFixed(4)),
        monthly: Number((plan.price.monthly * (1 + markupPercent / 100)).toFixed(2)),
      },
    }));

    const data = {
      plans: plansWithPricing,
      regions: filteredRegions,
      images: images.length > 0 ? images : [{ id: "linode/windows10", label: "Windows 10" }],
    };

    await setCache("market:data", data, 300);
    sendSuccess(res, data);
  } catch (error) {
    logger.error({ error }, "Failed to fetch market data");
    sendError(res, "Failed to fetch market data");
  }
});

router.post(
  "/market/order",
  requireAuth,
  attachUser,
  requireActiveUser,
  orderRateLimit,
  async (req: AuthRequest, res) => {
    try {
      const parsed = createOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        sendValidationError(res, parsed.error.flatten().fieldErrors);
        return;
      }

      const { plan, region, image, durationDays } = parsed.data;
      const userId = req.user!.id;

      const [settings, existingActive] = await Promise.all([
        prisma.marketSettings.findMany(),
        prisma.order.count({
          where: {
            userId,
            status: { in: [OrderStatus.PENDING, OrderStatus.ACTIVE] },
          },
        }),
      ]);

      const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
      const maxActiveOrders = settingsMap.max_active_orders as number ?? 5;

      if (existingActive >= maxActiveOrders) {
        sendError(res, "Maximum active orders reached", 400);
        return;
      }

      const plans = await getPlans();
      const selectedPlan = plans.find(p => p.id === plan);
      if (!selectedPlan) {
        sendError(res, "Invalid plan selected", 400);
        return;
      }

      const markupPercent = settingsMap.markup_percentage as number ?? 20;
      const monthlyPrice = selectedPlan.price.monthly * (1 + markupPercent / 100);
      const totalAmount = Number((monthlyPrice * (durationDays / 30)).toFixed(2));

      if (req.user!.balance < totalAmount) {
        sendError(res, "Insufficient balance", 400);
        return;
      }

      const rdpPassword = generatePassword(16);
      const label = `cyberise-rdp-${userId.slice(0, 8)}-${Date.now()}`;

      let linodeInstance;
      try {
        linodeInstance = await createInstance({
          region,
          type: plan,
          image,
          label,
          root_pass: rdpPassword,
          tags: ["cyberise-rdp", userId.slice(0, 8)],
        });
      } catch (error) {
        logger.error({ error, plan, region }, "Linode instance creation failed");
        sendError(res, "Failed to provision instance. Please try a different region or plan.", 503);
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      let order;
      try {
        order = await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: userId },
            data: { balance: { decrement: totalAmount } },
          });

          return tx.order.create({
            data: {
              userId,
              plan,
              region,
              image,
              linodeInstanceId: linodeInstance.id,
              ip: linodeInstance.ipv4[0],
              rdpUsername: "root",
              rdpPasswordEncrypted: encrypt(rdpPassword),
              status: OrderStatus.ACTIVE,
              amount: totalAmount,
              durationDays,
              expiresAt,
            },
          });
        });
      } catch (err) {
        logger.error({ err, linodeId: linodeInstance.id }, "DB transaction failed after Linode creation — cleaning up instance");
        try {
          await deleteInstance(linodeInstance.id);
        } catch (cleanupErr) {
          logger.error({ cleanupErr, linodeId: linodeInstance.id }, "Failed to clean up orphaned Linode instance");
        }
        sendError(res, "Failed to create order", 500);
        return;
      }

      const emailContent = generateRDPCredentialsEmail({
        ip: linodeInstance.ipv4[0],
        username: "root",
        password: rdpPassword,
        expiresAt,
      });

      await sendEmail({
        to: req.user!.email,
        subject: "Your RDP Credentials - Cyberise",
        html: emailContent.html,
        text: emailContent.text,
        userId,
      });

      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action: "ORDER_CREATED",
          entity: "Order",
          entityId: order.id,
          metadata: { plan, region, amount: totalAmount },
        },
      });

      sendSuccess(res, {
        orderId: order.id,
        ip: linodeInstance.ipv4[0],
        username: "root",
        password: rdpPassword,
        expiresAt,
      }, 201);
    } catch (error) {
      logger.error({ error }, "Failed to create order");
      sendError(res, "Failed to create order");
    }
  }
);

export default router;
