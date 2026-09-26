import { randomUUID } from "node:crypto";
import { prisma } from "@workspace/db";
import { logger } from "../lib/logger";
import { decrypt } from "../utils/encryption";
import {
  generateRDPCredentialsEmail,
  generateSSHCredentialsEmail,
  sendEmail,
} from "./email";

const LOCK_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_RETRY_DELAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

type DeliveryAttempt = { attempted: boolean; sent: boolean };

export async function ensureCredentialEmailDelivery(orderId: string) {
  return prisma.credentialEmailDelivery.upsert({
    where: { orderId },
    create: { orderId, nextAttemptAt: new Date(0) },
    update: {},
  });
}

export async function attemptCredentialEmailDelivery(
  orderId: string,
): Promise<DeliveryAttempt> {
  let deliveryId: string | undefined;
  let lockToken: string | undefined;

  try {
    const delivery = await prisma.credentialEmailDelivery.findUnique({
      where: { orderId },
      include: { order: { include: { user: true } } },
    });
    if (!delivery || delivery.status === "SENT") {
      return { attempted: false, sent: false };
    }

    const now = new Date();
    const staleLockBefore = new Date(now.getTime() - LOCK_TIMEOUT_MS);
    lockToken = randomUUID();
    const claim = await prisma.credentialEmailDelivery.updateMany({
      where: {
        id: delivery.id,
        OR: [
          {
            status: { in: ["PENDING", "FAILED"] },
            nextAttemptAt: { lte: now },
          },
          {
            status: "PROCESSING",
            lockedAt: { lt: staleLockBefore },
          },
        ],
      },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
        lockedAt: now,
        lockToken,
      },
    });
    if (claim.count === 0) {
      return { attempted: false, sent: false };
    }

    deliveryId = delivery.id;
    const { order } = delivery;
    if (
      !order.user.email ||
      !order.ip ||
      !order.rdpUsername ||
      !order.rdpPasswordEncrypted ||
      !order.expiresAt
    ) {
      throw new Error("Order or user is missing credential email details");
    }

    const metadata = order.metadata as Record<string, unknown> | null;
    const isLinux = metadata?.tier !== "pro";
    const emailContent = isLinux
      ? generateSSHCredentialsEmail({
          ip: order.ip,
          username: order.rdpUsername,
          password: decrypt(order.rdpPasswordEncrypted),
          expiresAt: order.expiresAt,
        })
      : generateRDPCredentialsEmail({
          ip: order.ip,
          username: order.rdpUsername,
          password: decrypt(order.rdpPasswordEncrypted),
          expiresAt: order.expiresAt,
        });

    const result = await sendEmail({
      to: order.user.email,
      subject: isLinux
        ? "Your Linux Server Credentials — Cyberise"
        : "Your RDP Server Credentials — Cyberise",
      html: emailContent.html,
      text: emailContent.text,
      userId: order.userId,
      idempotencyKey: `order-credentials-${order.id}`,
    });

    if (!result.success) {
      throw new Error(result.error || "Credential email delivery failed");
    }

    await prisma.credentialEmailDelivery.updateMany({
      where: { id: delivery.id, status: "PROCESSING", lockToken },
      data: {
        status: "SENT",
        sentAt: new Date(),
        lockedAt: null,
        lockToken: null,
        lastError: null,
      },
    });
    return { attempted: true, sent: true };
  } catch (error) {
    try {
      if (deliveryId && lockToken) {
        const delivery = await prisma.credentialEmailDelivery.findUnique({
          where: { id: deliveryId },
          select: { attempts: true },
        });
        if (delivery) {
          const delayMs = Math.min(
            60_000 * 2 ** Math.max(delivery.attempts - 1, 0),
            MAX_RETRY_DELAY_MS,
          );
          await prisma.credentialEmailDelivery.updateMany({
            where: {
              id: deliveryId,
              status: "PROCESSING",
              lockToken,
            },
            data: {
              status: "FAILED",
              nextAttemptAt: new Date(Date.now() + delayMs),
              lockedAt: null,
              lockToken: null,
              lastError: String(error).slice(0, 1000),
            },
          });
        }
      }
    } catch (persistenceError) {
      logger.error(
        { error: persistenceError, orderId },
        "Unable to persist credential email retry state",
      );
    }
    logger.error({ error, orderId }, "Credential email delivery failed");
    return { attempted: Boolean(deliveryId), sent: false };
  }
}

export async function retryDueCredentialEmailDeliveries(): Promise<{
  attempted: number;
  sent: number;
  failed: number;
}> {
  const now = new Date();
  const staleLockBefore = new Date(now.getTime() - LOCK_TIMEOUT_MS);
  const dueDeliveries = await prisma.credentialEmailDelivery.findMany({
    where: {
      OR: [
        {
          status: { in: ["PENDING", "FAILED"] },
          nextAttemptAt: { lte: now },
        },
        {
          status: "PROCESSING",
          lockedAt: { lt: staleLockBefore },
        },
      ],
    },
    select: { orderId: true },
    orderBy: { nextAttemptAt: "asc" },
    take: BATCH_SIZE,
  });

  let attempted = 0;
  let sent = 0;
  for (const delivery of dueDeliveries) {
    const result = await attemptCredentialEmailDelivery(delivery.orderId);
    if (!result.attempted) continue;
    attempted++;
    if (result.sent) sent++;
  }
  return { attempted, sent, failed: attempted - sent };
}
