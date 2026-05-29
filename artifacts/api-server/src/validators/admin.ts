import { z } from "zod";

export const banUserSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().optional(),
});

export const updateSettingsSchema = z.record(z.string(), z.unknown());

export const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "TERMINATED", "FAILED"]).optional(),
  extendDays: z.number().int().positive().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v[0] : v))
    .optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
