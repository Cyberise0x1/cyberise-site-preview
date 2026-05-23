import { z } from "zod";

// Scoped schemas — each feature validates only the slice it needs at runtime.
// Routes that don't touch a given integration won't trip validation for it.

export const coreEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_SECRET: z.string().min(32),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  CRON_SECRET: z.string().optional(),
});

export const redisEnvSchema = z.object({
  REDIS_URL: z.string().min(1),
  REDIS_TOKEN: z.string().min(1),
});

export const clerkEnvSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
});

export const linodeEnvSchema = z.object({
  LINODE_API_TOKEN: z.string().min(1),
  LINODE_API_URL: z.string().default("https://api.linode.com/v4"),
});

export const resendEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  RESEND_SENDER_ADDRESS: z.string().email(),
  CONTACT_RECIPIENT_EMAIL: z.string().email(),
});

export const nowPaymentsEnvSchema = z.object({
  NOWPAYMENTS_API_KEY: z.string().min(1),
  NOWPAYMENTS_IPN_SECRET: z.string().min(1),
  NOWPAYMENTS_API_URL: z.string().default("https://api.nowpayments.io"),
});

export const rdpMonsterEnvSchema = z.object({
  RDP_MONSTER_API_KEY: z.string().optional(),
  RDP_MONSTER_EMAIL: z.string().optional(),
  RDP_MONSTER_API_URL: z
    .string()
    .default("https://manager.rdp.monster/api.php"),
});

// Aggregate schema — kept for tooling/tests that want a full sanity check.
export const serverEnvSchema = coreEnvSchema
  .merge(redisEnvSchema)
  .merge(clerkEnvSchema)
  .merge(linodeEnvSchema)
  .merge(resendEnvSchema)
  .merge(nowPaymentsEnvSchema)
  .merge(rdpMonsterEnvSchema);

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export type EnvScope =
  | "core"
  | "redis"
  | "clerk"
  | "linode"
  | "resend"
  | "nowpayments"
  | "rdpmonster";

export const envScopeSchemas = {
  core: coreEnvSchema,
  redis: redisEnvSchema,
  clerk: clerkEnvSchema,
  linode: linodeEnvSchema,
  resend: resendEnvSchema,
  nowpayments: nowPaymentsEnvSchema,
  rdpmonster: rdpMonsterEnvSchema,
} as const satisfies Record<EnvScope, z.ZodTypeAny>;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `  ${i.path.join(".")}: ${i.message}`)
    .join("\n");
}

export function validateEnvScope<S extends EnvScope>(
  scope: S,
): z.infer<(typeof envScopeSchemas)[S]> {
  const schema = envScopeSchemas[scope];
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables for "${scope}":\n${formatIssues(parsed.error)}`,
    );
  }
  return parsed.data as z.infer<(typeof envScopeSchemas)[S]>;
}

export function validateServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid server environment variables:");
    console.error(formatIssues(parsed.error));
    throw new Error("Invalid server environment variables");
  }

  return parsed.data;
}
