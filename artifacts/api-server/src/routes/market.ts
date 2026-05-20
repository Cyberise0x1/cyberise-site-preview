import { Router, type IRouter } from "express";
import { OrderStatus } from "@workspace/db";
import { prisma } from "@workspace/db";
import { getPlans, getRegions, getWindowsImages, deleteInstance } from "../services/linode";
import { getProPlans, getProRegions, deleteProInstance } from "../services/rdpmonster";
import { getCache, setCache } from "../services/redis";
import { sendEmail, generateRDPCredentialsEmail } from "../services/email";
import { encrypt } from "../utils/encryption";
import { provisionInstance, type ProvisionResult } from "../services/provisioning";
import { sendSuccess, sendError, sendValidationError } from "../utils/responses";
import { requireAuth, attachUser, requireActiveUser } from "../middleware/auth";
import { marketRateLimit, orderRateLimit } from "../middleware/rateLimit";
import { createOrderSchema } from "../validators/market";
import { cryptoOrderSchema, estimateSchema } from "../validators/crypto";
import {
  getCurrencies,
  getEstimate,
  createPayment,
  getPaymentStatus,
} from "../services/nowpayments";
import type { NowPaymentsCurrency } from "../services/nowpayments";
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

      const markupPercent =
        (settingsMap.markup_percentage as number) ?? 20;

      let orderResult: ProvisionResult;
      try {
        orderResult = await provisionInstance({
          plan,
          region,
          image: image ?? "unknown",
          tier,
          userId,
          durationDays,
          markupPercent,
        });
      } catch (err: unknown) {
        const e = err as Error & { statusCode?: number };
        logger.error({ err }, "Provisioning failed");
        sendError(
          res,
          e.message || "Failed to provision instance",
          e.statusCode || 503,
        );
        return;
      }

      if (req.user!.balance < orderResult.totalAmount) {
        sendError(res, "Insufficient balance", 400);
        return;
      }

      const { totalAmount, expiresAt } = orderResult;

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

router.get("/market/crypto/currencies", async (_req, res) => {
  try {
    const currencies = await getCurrencies();
    sendSuccess(res, currencies);
  } catch (error) {
    logger.error({ error }, "Failed to fetch crypto currencies");
    sendError(res, "Failed to fetch crypto currencies");
  }
});

router.post("/market/crypto/estimate", async (req, res) => {
  try {
    const parsed = estimateSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error.flatten().fieldErrors);
      return;
    }

    const { amount, currencyFrom, currencyTo } = parsed.data;
    const estimate = await getEstimate(amount, currencyFrom, currencyTo);
    sendSuccess(res, estimate);
  } catch (error) {
    logger.error({ error }, "Failed to estimate crypto price");
    sendError(res, "Failed to estimate crypto price");
  }
});

router.post(
  "/market/crypto/order",
  requireAuth,
  attachUser,
  requireActiveUser,
  orderRateLimit,
  async (req: AuthRequest, res) => {
    try {
      const parsed = cryptoOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        sendValidationError(res, parsed.error.flatten().fieldErrors);
        return;
      }

      const { plan, region, image, durationDays, tier, payCurrency } =
        parsed.data;
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

      const settingsMap = Object.fromEntries(
        settings.map((s) => [s.key, s.value]),
      );
      const maxActiveOrders = (settingsMap.max_active_orders as number) ?? 5;

      if (existingActive >= maxActiveOrders) {
        sendError(res, "Maximum active orders reached", 400);
        return;
      }

      const markupPercent =
        (settingsMap.markup_percentage as number) ?? 20;

      let orderResult: ProvisionResult;
      try {
        orderResult = await provisionInstance({
          plan,
          region,
          image: image ?? "unknown",
          tier,
          userId,
          durationDays,
          markupPercent,
        });
      } catch (err: unknown) {
        const e = err as Error & { statusCode?: number };
        logger.error({ err }, "Price calculation failed for crypto order");
        sendError(
          res,
          e.message || "Failed to calculate price",
          e.statusCode || 400,
        );
        return;
      }

      const { totalAmount } = orderResult;

      const nowpaymentsResult = await createPayment({
        price_amount: totalAmount,
        price_currency: "usd",
        pay_currency: payCurrency,
        order_id: `cyberise-${userId.slice(0, 8)}`,
        order_description: `RDP Server - ${tier.toUpperCase()} tier`,
        ipn_callback_url: `https://cyberise.org/api/webhooks/nowpayments`,
      });

      const order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            userId,
            plan,
            region,
            image: image ?? "unknown",
            status: OrderStatus.PENDING,
            amount: totalAmount,
            durationDays,
            metadata: { tier, paymentMethod: "crypto" },
          },
        });

        await tx.cryptoPayment.create({
          data: {
            orderId: created.id,
            paymentId: nowpaymentsResult.payment_id,
            payAddress: nowpaymentsResult.pay_address,
            payCurrency: nowpaymentsResult.pay_currency,
            cryptoAmount: nowpaymentsResult.pay_amount,
            fiatAmount: totalAmount,
            fiatCurrency: "usd",
            paymentStatus: nowpaymentsResult.payment_status,
          },
        });

        return created;
      });

      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action: "CRYPTO_ORDER_CREATED",
          entity: "Order",
          entityId: order.id,
          metadata: {
            plan,
            region,
            amount: totalAmount,
            tier,
            paymentId: nowpaymentsResult.payment_id,
            payCurrency,
          },
        },
      });

      sendSuccess(
        res,
        {
          orderId: order.id,
          paymentId: nowpaymentsResult.payment_id,
          payAddress: nowpaymentsResult.pay_address,
          payCurrency: nowpaymentsResult.pay_currency,
          cryptoAmount: nowpaymentsResult.pay_amount,
          fiatAmount: totalAmount,
          paymentStatus: nowpaymentsResult.payment_status,
        },
        201,
      );
    } catch (error) {
      logger.error({ error }, "Failed to create crypto order");
      sendError(res, "Failed to create crypto order");
    }
  },
);

router.get(
  "/market/crypto/payment/:paymentId",
  requireAuth,
  attachUser,
  async (req: AuthRequest, res) => {
    try {
      const paymentId = Array.isArray(req.params.paymentId)
        ? req.params.paymentId[0]
        : req.params.paymentId;
      const userId = req.user!.id;

      const cryptoPayment = await prisma.cryptoPayment.findUnique({
        where: { paymentId },
        include: { order: { select: { userId: true, status: true } } },
      });

      if (!cryptoPayment) {
        sendError(res, "Payment not found", 404);
        return;
      }

      if (cryptoPayment.order.userId !== userId) {
        sendError(res, "Unauthorized", 403);
        return;
      }

      const status = await getPaymentStatus(paymentId);

      await prisma.cryptoPayment.update({
        where: { paymentId },
        data: {
          paymentStatus: status.payment_status,
          actuallyPaid: status.actually_paid,
          ipnReceivedAt: new Date(),
        },
      });

      sendSuccess(res, {
        paymentId: status.payment_id,
        paymentStatus: status.payment_status,
        actuallyPaid: status.actually_paid,
        payAmount: status.pay_amount,
        payCurrency: status.pay_currency,
        orderStatus: cryptoPayment.order.status,
      });
    } catch (error) {
      logger.error({ error }, "Failed to check crypto payment status");
      sendError(res, "Failed to check payment status");
    }
  },
);

export default router;
