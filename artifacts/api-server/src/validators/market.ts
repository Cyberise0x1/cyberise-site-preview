import { z } from "zod";

export const createOrderSchema = z.object({
  plan: z.string().min(1, "Plan is required"),
  region: z.string().min(1, "Region is required"),
  image: z.string().optional(),
  durationDays: z.number().int().min(7).max(365).default(30),
  tier: z.enum(["basic", "pro"]).default("basic"),
  promoCode: z.string().optional(),
});

export const orderIdSchema = z.object({
  id: z.string().uuid(),
});

export const validatePromoSchema = z.object({
  code: z.string().min(1, "Promo code is required"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderIdInput = z.infer<typeof orderIdSchema>;
export type ValidatePromoInput = z.infer<typeof validatePromoSchema>;
