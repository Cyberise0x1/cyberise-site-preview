import { z } from "zod";

export const createOrderSchema = z.object({
  plan: z.string().min(1, "Plan is required"),
  region: z.string().min(1, "Region is required"),
  image: z.string().min(1, "Image is required"),
  durationDays: z.number().int().min(7).max(365).default(30),
});

export const orderIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderIdInput = z.infer<typeof orderIdSchema>;
