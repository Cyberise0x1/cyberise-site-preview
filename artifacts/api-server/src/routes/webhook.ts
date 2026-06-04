import { Router, type IRouter } from "express";
import { Webhook } from "svix";
import { prisma, OrderStatus, UserRole } from "@workspace/db";
import { sendSuccess, sendError } from "../utils/responses";
import { env } from "../utils/env";
import { logger } from "../lib/logger";
import { verifyIpnSignature } from "../services/nowpayments";
import { provisionInstance } from "../services/provisioning";
import { encrypt } from "../utils/encryption";
import { sendEmail, generateRDPCredentialsEmail } from "../services/email";

const router: IRouter = Router();

interface WebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ id?: string; email_address: string }>;
    primary_email_address_id?: string;
    public_metadata?: { role?: unknown } & Record<string, unknown>;
    [key: string]: unknown;
  };
}

/**
 * Strict mirror: Clerk is the single source of truth for role. Anything that
 * isn't exactly "ADMIN" in public_metadata resolves to USER, so clearing the
 * flag in Clerk demotes the user on the next sync.
 */
export function resolveRole(publicMetadata: unknown): UserRole {
  const role = (publicMetadata as { role?: unknown } | null | undefined)?.role;
  return role === "ADMIN" ? UserRole.ADMIN : UserRole.USER;
}

/**
 * Prefer the primary email address, falling back to the first one present.
 * Clerk's `primary_email_address_id` is the email object's `id` (e.g. "idn_…"),
 * not the email string, so match on `e.id`.
 */
export function extractPrimaryEmail(
  data: WebhookEvent["data"],
): string | undefined {
  const primaryEmailId = data.primary_email_address_id;
  const addresses = data.email_addresses ?? [];
  return (
    addresses.find((e) => e.id === primaryEmailId)?.email_address ??
    addresses[0]?.email_address
  );
}

/**
 * Mirror a Clerk user (id, email, role) into the database. Creates the row if
 * it doesn't exist yet, updates role/email otherwise, and writes an audit log
 * whenever the role actually changes. Used for both user.created and
 * user.updated so Clerk metadata stays authoritative.
 */
export async function syncUserFromClerk(
  data: WebhookEvent["data"],
): Promise<void> {
  const email = extractPrimaryEmail(data);
  const role = resolveRole(data.public_metadata);
  const existing = await prisma.user.findUnique({ where: { id: data.id } });

  if (existing) {
    await prisma.user.update({
      where: { id: data.id },
      data: { role, ...(email ? { email } : {}) },
    });
    if (existing.role !== role) {
      await prisma.auditLog.create({
        data: {
          actorId: data.id,
          action: "USER_ROLE_SYNCED",
          entity: "User",
          entityId: data.id,
          metadata: { from: existing.role, to: role, source: "clerk_webhook" },
        },
      });
    }
    return;
  }

  if (!email) {
    logger.warn({ userId: data.id }, "No email for user; cannot create DB row");
    return;
  }

  await prisma.user.create({
    data: { id: data.id, email, role, balance: 0, banned: false },
  });
  if (role !== UserRole.USER) {
    await prisma.auditLog.create({
      data: {
        actorId: data.id,
        action: "USER_ROLE_SYNCED",
        entity: "User",
        entityId: data.id,
        metadata: { from: UserRole.USER, to: role, source: "clerk_webhook" },
      },
    });
  }
}

/**
 * Soft-delete a user by setting `banned`. Uses updateMany so a delete event for
 * a user we never mirrored is an idempotent no-op (count 0) rather than a P2025
 * throw — which would surface as a 500 and make Clerk retry the event forever.
 */
export async function softDeleteUser(data: WebhookEvent["data"]): Promise<void> {
  const { count } = await prisma.user.updateMany({
    where: { id: data.id },
    data: { banned: true },
  });

  if (count === 0) {
    logger.warn({ userId: data.id }, "User.deleted for unknown user");
  } else {
    logger.info({ userId: data.id }, "User soft-deleted");
  }
}

router.post("/webhooks/clerk", async (req, res) => {
  try {
    // Svix HMAC is computed over the exact raw bytes; re-serializing req.body
    // (after express.json) changes whitespace/key-order and breaks verification.
    const payload = req.rawBody?.toString("utf-8");
    if (!payload) {
      logger.warn("Clerk webhook missing raw body");
      sendError(res, "Invalid signature", 401);
      return;
    }
    const headers = req.headers as Record<string, string>;

    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
    let event: WebhookEvent;

    try {
      event = wh.verify(payload, headers) as WebhookEvent;
    } catch (err) {
      logger.warn({ err }, "Invalid webhook signature");
      sendError(res, "Invalid signature", 401);
      return;
    }

    const { type, data } = event;

    switch (type) {
      case "user.created": {
        await syncUserFromClerk(data);
        logger.info({ userId: data.id }, "User created");
        break;
      }

      case "user.updated": {
        await syncUserFromClerk(data);
        logger.info({ userId: data.id }, "User updated");
        break;
      }

      case "user.deleted": {
        await softDeleteUser(data);
        break;
      }

      default:
        logger.debug({ type }, "Unhandled webhook event");
    }

    sendSuccess(res, { received: true });
  } catch (error) {
    logger.error({ error }, "Webhook processing error");
    sendError(res, "Webhook processing failed");
  }
});

router.post("/webhooks/nowpayments", async (req, res) => {
  try {
    const rawBody = req.rawBody?.toString("utf-8") ?? "";
    const signature = (req.headers["x-nowpayments-sig"] as string) || "";

    if (!verifyIpnSignature(rawBody, signature)) {
      logger.warn("Invalid NowPayments IPN signature");
      sendError(res, "Invalid signature", 401);
      return;
    }

    const ipnData = JSON.parse(rawBody) as {
      payment_id: string;
      payment_status: string;
      price_amount: number;
      pay_amount: number;
      actually_paid: number;
    };
    const { payment_id, payment_status, actually_paid } = ipnData;

    logger.info({ payment_id, payment_status }, "NowPayments IPN received");

    const cryptoPayment = await prisma.cryptoPayment.findUnique({
      where: { paymentId: payment_id },
      include: { order: true },
    });

    if (!cryptoPayment) {
      logger.warn({ payment_id }, "IPN for unknown payment");
      sendSuccess(res, { received: true });
      return;
    }

    await prisma.cryptoPayment.update({
      where: { paymentId: payment_id },
      data: {
        paymentStatus: payment_status,
        actuallyPaid: actually_paid ?? undefined,
        ipnReceivedAt: new Date(),
      },
    });

    if (payment_status === "confirmed" || payment_status === "finished") {
      const order = cryptoPayment.order;

      if (order.status !== OrderStatus.PENDING) {
        logger.info(
          { orderId: order.id, status: order.status },
          "Order already processed, skipping provisioning",
        );
        sendSuccess(res, { received: true });
        return;
      }

      try {
        const metadata = order.metadata as Record<string, unknown> | null;
        const tier = (metadata?.tier as "basic" | "pro") ?? "basic";
        const durationDays = order.durationDays;

        const settings = await prisma.marketSettings.findMany();
        const settingsMap = Object.fromEntries(
          settings.map((s) => [s.key, s.value]),
        );
        const markupPercent = (settingsMap.markup_percentage as number) ?? 20;

        const provisionResult = await provisionInstance({
          plan: order.plan,
          region: order.region,
          image: order.image,
          tier,
          userId: order.userId,
          durationDays,
          markupPercent,
        });

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.ACTIVE,
            ip: provisionResult.ip,
            rdpUsername: provisionResult.username,
            rdpPasswordEncrypted: encrypt(provisionResult.password),
            linodeInstanceId:
              tier === "basic" && typeof provisionResult.instanceId === "number"
                ? provisionResult.instanceId
                : undefined,
            expiresAt: provisionResult.expiresAt,
            metadata: {
              ...(order.metadata as object),
              instanceId: provisionResult.instanceId,
              ip: provisionResult.ip,
            },
          },
        });

        await prisma.cryptoPayment.update({
          where: { paymentId: payment_id },
          data: { completedAt: new Date() },
        });

        const user = await prisma.user.findUnique({
          where: { id: order.userId },
        });

        if (user?.email) {
          const emailContent = generateRDPCredentialsEmail({
            ip: provisionResult.ip,
            username: provisionResult.username,
            password: provisionResult.password,
            expiresAt: provisionResult.expiresAt,
          });

          await sendEmail({
            to: user.email,
            subject: "Your Server Credentials — Cyberise",
            html: emailContent.html,
            text: emailContent.text,
            userId: order.userId,
          });
        }

        await prisma.auditLog.create({
          data: {
            actorId: order.userId,
            action: "CRYPTO_PAYMENT_CONFIRMED",
            entity: "Order",
            entityId: order.id,
            metadata: {
              paymentId: payment_id,
              paymentStatus: payment_status,
              tier,
            },
          },
        });

        logger.info(
          { orderId: order.id, paymentId: payment_id },
          "Crypto payment confirmed, server provisioned",
        );
      } catch (err) {
        logger.error(
          { err, orderId: order.id, paymentId: payment_id },
          "Provisioning failed after crypto payment confirmation",
        );

        await prisma.cryptoPayment.update({
          where: { paymentId: payment_id },
          data: { paymentStatus: "provision_failed" },
        });

        await prisma.auditLog.create({
          data: {
            action: "PROVISION_FAILED_AFTER_PAYMENT",
            entity: "Order",
            entityId: order.id,
            metadata: {
              paymentId: payment_id,
              error: String(err),
            },
          },
        });
      }

      sendSuccess(res, { received: true });
      return;
    }

    if (payment_status === "partially_paid") {
      logger.info(
        { payment_id, actually_paid },
        "Partially paid — not provisioning",
      );
      await prisma.auditLog.create({
        data: {
          action: "CRYPTO_PAYMENT_PARTIAL",
          entity: "CryptoPayment",
          entityId: cryptoPayment.id,
          metadata: {
            paymentId: payment_id,
            actuallyPaid: actually_paid,
          },
        },
      });
      sendSuccess(res, { received: true });
      return;
    }

    if (
      payment_status === "failed" ||
      payment_status === "expired" ||
      payment_status === "refunded"
    ) {
      await prisma.order.update({
        where: { id: cryptoPayment.orderId },
        data: { status: OrderStatus.FAILED },
      });

      await prisma.cryptoPayment.update({
        where: { paymentId: payment_id },
        data: { completedAt: new Date() },
      });

      await prisma.auditLog.create({
        data: {
          actorId: cryptoPayment.order.userId,
          action: "CRYPTO_PAYMENT_FAILED",
          entity: "Order",
          entityId: cryptoPayment.orderId,
          metadata: {
            paymentId: payment_id,
            paymentStatus: payment_status,
          },
        },
      });

      logger.info(
        { orderId: cryptoPayment.orderId, paymentStatus: payment_status },
        "Crypto payment failed/expired/refunded",
      );
    }

    sendSuccess(res, { received: true });
  } catch (error) {
    logger.error({ error }, "NowPayments IPN processing error");
    sendError(res, "Webhook processing failed");
  }
});

export default router;
