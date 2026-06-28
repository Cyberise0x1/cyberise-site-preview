import { z } from "zod";

export const cryptoOrderSchema = z.object({
  plan: z.string().min(1),
  region: z.string().min(1),
  image: z.string().optional(),
  durationDays: z.number().int().min(7).max(365).default(30),
  tier: z.enum(["basic", "pro"]).default("basic"),
  payCurrency: z.string().min(1),
  promoCode: z.string().optional(),
});

export const estimateSchema = z.object({
  amount: z.number().positive(),
  currencyFrom: z.string().default("usd"),
  currencyTo: z.string().min(1),
});
