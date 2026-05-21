import { z } from "zod";

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  REDIS_TOKEN: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  LINODE_API_TOKEN: z.string().min(1),
  LINODE_API_URL: z.string().default("https://api.linode.com/v4"),
  RESEND_API_KEY: z.string().min(1),
  RESEND_SENDER_ADDRESS: z.string().email(),
  CONTACT_RECIPIENT_EMAIL: z.string().email(),
  ENCRYPTION_SECRET: z.string().min(32),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  CRON_SECRET: z.string().optional(),
  NOWPAYMENTS_API_KEY: z.string().min(1),
  NOWPAYMENTS_IPN_SECRET: z.string().min(1),
  NOWPAYMENTS_API_URL: z.string().default("https://api.nowpayments.io"),
  RDP_MONSTER_API_KEY: z.string().optional(),
  RDP_MONSTER_EMAIL: z.string().optional(),
  RDP_MONSTER_API_URL: z
    .string()
    .default("https://manager.rdp.monster/api.php"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function validateServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid server environment variables:");
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error("Invalid server environment variables");
  }

  return parsed.data;
}
