import { Router, type IRouter } from "express";
import { OrderStatus } from "@workspace/db";
import { prisma } from "@workspace/db";
import { getPlans, getRegions, getWindowsImages, createInstance, deleteInstance } from "../services/linode";
import { getProPlans, getProRegions, createProInstance, deleteProInstance } from "../services/rdpmonster";
import { getCache, setCache } from "../services/redis";
import { sendEmail, generateRDPCredentialsEmail } from "../services/email";
import { encrypt, generatePassword } from "../utils/encryption";
import { sendSuccess, sendError, sendValidationError } from "../utils/responses";
import { requireAuth, attachUser, requireActiveUser } from "../middleware/auth";
import { marketRateLimit, orderRateLimit } from "../middleware/rateLimit";
import { createOrderSchema } from "../validators/market";
import { logger } from "../lib/logger";
import type { AuthRequest } from "../middleware/auth";

/**
 * Strips provider branding from Basic (Linode) plan and region labels.
 * Any label containing the provider name must be replaced before sending to the buyer.
 */
function sanitizeBasicLabel(label: string): string {
  return label
    .replace(/\bLinode\b/gi, "")
    .replace(/\bNanode\b/gi, "Starter")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const router: IRouter = Router();

router.get("/market/plans", marketRateLimit, async (_req, res) => {
  try {
    const cached = await getCache<object>("market:data");
    if (cached) {
      sendSuccess(res, cached);
      return;
    }

    const settings = await prisma.marketSettings.findMany();
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

    const [basicPlans, basicRegions, images, proPlans, proRegions] = await Promise.all([
      getPlans(),
      getRegions(),
      getWindowsImages(),
      getProPlans(),
      getProRegions(),
    ]);

    const enabledRegions = settingsMap.enabled_regions as string[] ?? basicRegions.map(r => r.id);
    const enabledPlans = settingsMap.enabled_plans as string[] ?? basicPlans.map(p => p.id);

    const filteredBasicRegions = basicRegions
      .filter(r => enabledRegions.includes(r.id))
      .map(r => ({ ...r, label: sanitizeBasicLabel(r.label), tier: "basic" as const }));

    const filteredBasicPlans = basicPlans
      .filter(p => enabledPlans.includes(p.id))
      .map(p => ({ ...p, label: sanitizeBasicLabel(p.label), tier: "basic" as const }));

    const markupPercent = settingsMap.markup_percentage as number ?? 20;
    const basicPlansWithPricing = filteredBasicPlans.map(plan => ({
      ...plan,
      price: {
        hourly: Number((plan.price.hourly * (1 + markupPercent / 100)).toFixed(4)),
        monthly: Number((plan.price.monthly * (1 + markupPercent / 100)).toFixed(2)),
      },
    }));

    const proPlansWithPricing = proPlans.map(plan => ({
      ...plan,
      price: {
        hourly: Number((plan.price.hourly * (1 + markupPercent / 100)).toFixed(4)),
        monthly: Number((plan.price.monthly * (1 + markupPercent / 100)).toFixed(2)),
      },
    }));

    const proRegionsTagged = proRegions.map(r => ({ ...r, tier: "pro" as const }));

    const data = {
      plans: [...basicPlansWithPricing, ...proPlansWithPricing],
      regions: [...filteredBasicRegions, ...proRegionsTagged],
      images,
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

      const { plan, region, image, durationDays, tier } = parsed.data;
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

      let totalAmount: number;
      let orderResult: { ip: string; username: string; password: string; instanceId?: string | number };

      if (tier === "pro") {
        const proPlans = await getProPlans();
        const selectedPlan = proPlans.find(p => p.id === plan);
        if (!selectedPlan) {
          sendError(res, "Invalid plan selected", 400);
          return;
        }

        const markupPercent = settingsMap.markup_percentage as number ?? 20;
        const monthlyPrice = selectedPlan.price.monthly * (1 + markupPercent / 100);
        totalAmount = Number((monthlyPrice * (durationDays / 30)).toFixed(2));

        if (req.user!.balance < totalAmount) {
          sendError(res, "Insufficient balance", 400);
          return;
        }

        const label = `cyberise-pro-${userId.slice(0, 8)}-${Date.now()}`;
        const instance = await createProInstance({ planId: plan, regionId: region, label });
        orderResult = { ip: instance.ip, username: instance.username, password: instance.password, instanceId: instance.instanceId };
      } else {
        const basicPlans = await getPlans();
        const selectedPlan = basicPlans.find(p => p.id === plan);
        if (!selectedPlan) {
          sendError(res, "Invalid plan selected", 400);
          return;
        }

        const markupPercent = settingsMap.markup_percentage as number ?? 20;
        const monthlyPrice = selectedPlan.price.monthly * (1 + markupPercent / 100);
        totalAmount = Number((monthlyPrice * (durationDays / 30)).toFixed(2));

        if (req.user!.balance < totalAmount) {
          sendError(res, "Insufficient balance", 400);
          return;
        }

        if (!image) {
          sendError(res, "Image selection is required for this plan", 400);
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
          logger.error({ error, plan, region }, "Instance creation failed");
          sendError(res, "Failed to provision instance. Please try a different region or plan.", 503);
          return;
        }

        orderResult = { ip: linodeInstance.ipv4[0], username: "Administrator", password: rdpPassword, instanceId: linodeInstance.id };
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
              image: image ?? "unknown",
              linodeInstanceId: tier === "basic" && typeof orderResult.instanceId === "number" ? orderResult.instanceId : null,
              ip: orderResult.ip,
              rdpUsername: orderResult.username,
              rdpPasswordEncrypted: encrypt(orderResult.password),
              status: OrderStatus.ACTIVE,
              amount: totalAmount,
              durationDays,
              expiresAt,
              metadata: {
                tier,
                ...(tier === "pro" ? { proInstanceId: String(orderResult.instanceId) } : {}),
              },
            },
          });
        });
      } catch (err) {
        logger.error({ err }, "DB transaction failed after instance creation — attempting provider cleanup");
        if (tier === "pro" && orderResult.instanceId) {
          try { await deleteProInstance(String(orderResult.instanceId)); } catch (cleanupErr) {
            logger.error({ cleanupErr, proInstanceId: orderResult.instanceId }, "Pro instance cleanup failed after DB rollback");
          }
        } else if (tier === "basic" && typeof orderResult.instanceId === "number") {
          try { await deleteInstance(orderResult.instanceId as number); } catch (cleanupErr) {
            logger.error({ cleanupErr, linodeInstanceId: orderResult.instanceId }, "Basic instance cleanup failed after DB rollback");
          }
        }
        sendError(res, "Failed to create order", 500);
        return;
      }

      const emailContent = generateRDPCredentialsEmail({
        ip: orderResult.ip,
        username: orderResult.username,
        password: orderResult.password,
        expiresAt,
      });

      await sendEmail({
        to: req.user!.email,
        subject: "Your Server Credentials — Cyberise",
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
          metadata: { plan, region, amount: totalAmount, tier },
        },
      });

      sendSuccess(res, {
        orderId: order.id,
        ip: orderResult.ip,
        username: orderResult.username,
        password: orderResult.password,
        expiresAt,
        tier,
      }, 201);
    } catch (error) {
      logger.error({ error }, "Failed to create order");
      sendError(res, "Failed to create order");
    }
  }
);

export default router;
