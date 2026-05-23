import {
  envScopeSchemas,
  serverEnvSchema,
  validateEnvScope,
  validateServerEnv,
  type EnvScope,
  type ServerEnv,
} from "./index";

// Scoped lazy accessors — validate the slice on first call, cache the result.
// Use these inside route handlers / functions so a missing var only fails
// the routes that actually need it, not the whole app at boot.

type ScopedEnv<S extends EnvScope> = ReturnType<
  (typeof envScopeSchemas)[S]["parse"]
>;

const scopeCache = new Map<EnvScope, unknown>();

function getScope<S extends EnvScope>(scope: S): ScopedEnv<S> {
  const cached = scopeCache.get(scope);
  if (cached !== undefined) return cached as ScopedEnv<S>;
  const value = validateEnvScope(scope) as ScopedEnv<S>;
  scopeCache.set(scope, value);
  return value;
}

export const getCoreEnv = () => getScope("core");
export const getRedisEnv = () => getScope("redis");
export const getClerkEnv = () => getScope("clerk");
export const getLinodeEnv = () => getScope("linode");
export const getResendEnv = () => getScope("resend");
export const getNowPaymentsEnv = () => getScope("nowpayments");
export const getRdpMonsterEnv = () => getScope("rdpmonster");

// Map each env var name to the scope that owns it, so the `env` proxy can
// validate only the relevant slice when a key is read.
const KEY_TO_SCOPE: Record<keyof ServerEnv, EnvScope> = {
  DATABASE_URL: "core",
  DIRECT_URL: "core",
  JWT_SECRET: "core",
  ENCRYPTION_SECRET: "core",
  NODE_ENV: "core",
  CRON_SECRET: "core",
  REDIS_URL: "redis",
  REDIS_TOKEN: "redis",
  CLERK_SECRET_KEY: "clerk",
  CLERK_WEBHOOK_SECRET: "clerk",
  LINODE_API_TOKEN: "linode",
  LINODE_API_URL: "linode",
  RESEND_API_KEY: "resend",
  RESEND_SENDER_ADDRESS: "resend",
  CONTACT_RECIPIENT_EMAIL: "resend",
  NOWPAYMENTS_API_KEY: "nowpayments",
  NOWPAYMENTS_IPN_SECRET: "nowpayments",
  NOWPAYMENTS_API_URL: "nowpayments",
  RDP_MONSTER_API_KEY: "rdpmonster",
  RDP_MONSTER_EMAIL: "rdpmonster",
  RDP_MONSTER_API_URL: "rdpmonster",
};

// Property-level lazy env. Reading `env.NOWPAYMENTS_API_KEY` validates only
// the nowpayments scope. Do NOT read `env.X` at module top-level — that pulls
// validation back to import time. Read inside functions instead.
export const env: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, prop) {
    if (typeof prop !== "string") return undefined;
    const scope = KEY_TO_SCOPE[prop as keyof ServerEnv];
    if (!scope) return undefined;
    const scoped = getScope(scope) as Record<string, unknown>;
    return scoped[prop];
  },
});

let fullCache: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (!fullCache) {
    fullCache = validateServerEnv();
  }
  return fullCache;
}

export { serverEnvSchema, validateEnvScope, type EnvScope, type ServerEnv };
