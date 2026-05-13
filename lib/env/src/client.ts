import { z } from "zod";

export const clientEnvSchema = z.object({
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function validateClientEnv(): ClientEnv {
  const env = {
    VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  };
  
  const parsed = clientEnvSchema.safeParse(env);
  
  if (!parsed.success) {
    console.error("Invalid client environment variables:");
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error("Invalid client environment variables");
  }
  
  return parsed.data;
}

let cachedEnv: ClientEnv | null = null;

export function getClientEnv(): ClientEnv {
  if (!cachedEnv) {
    cachedEnv = validateClientEnv();
  }
  return cachedEnv;
}
