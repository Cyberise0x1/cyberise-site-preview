import { prisma } from "@workspace/db";
import { logger } from "../lib/logger";

export interface PromoCodeValidation {
  valid: boolean;
  promoCodeId?: string;
  discountPercent?: number;
  error?: string;
}

/**
 * Validates a promo code for a given user.
 * Checks: exists, active, not expired, usage limits (global + per-user).
 */
export async function validatePromoCode(
  code: string,
  userId: string,
): Promise<PromoCodeValidation> {
  try {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return { valid: false, error: "Invalid promo code" };
    }

    if (!promoCode.active) {
      return { valid: false, error: "This promo code is no longer active" };
    }

    const now = new Date();
    if (promoCode.validFrom > now) {
      return { valid: false, error: "This promo code is not yet valid" };
    }

    if (promoCode.validUntil && promoCode.validUntil < now) {
      return { valid: false, error: "This promo code has expired" };
    }

    // Check global usage limit
    if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
      return { valid: false, error: "This promo code has reached its usage limit" };
    }

    // Check per-user usage
    const existingUsage = await prisma.promoCodeUsage.findUnique({
      where: {
        promoCodeId_userId: {
          promoCodeId: promoCode.id,
          userId,
        },
      },
    });

    if (existingUsage) {
      return { valid: false, error: "You have already used this promo code" };
    }

    return {
      valid: true,
      promoCodeId: promoCode.id,
      discountPercent: Number(promoCode.discountPercent),
    };
  } catch (error) {
    logger.error({ error, code, userId }, "Failed to validate promo code");
    return { valid: false, error: "Failed to validate promo code" };
  }
}

/**
 * Records a promo code usage. Called within an order transaction.
 */
export async function applyPromoCode(
  promoCodeId: string,
  userId: string,
  orderId: string,
  tx?: Parameters<typeof prisma.$transaction>[0] extends (arg: infer T) => any ? T : never,
): Promise<void> {
  const client = tx ?? prisma;

  await client.promoCodeUsage.create({
    data: {
      promoCodeId,
      userId,
      orderId,
    },
  });

  await client.promoCode.update({
    where: { id: promoCodeId },
    data: { usedCount: { increment: 1 } },
  });
}

/**
 * Calculates the discounted price.
 */
export function applyDiscount(
  originalAmount: number,
  discountPercent: number,
): number {
  const discount = originalAmount * (discountPercent / 100);
  return Number((originalAmount - discount).toFixed(2));
}
