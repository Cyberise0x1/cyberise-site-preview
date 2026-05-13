import { validateServerEnv, serverEnvSchema, type ServerEnv } from "./index";

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (!cachedEnv) {
    cachedEnv = validateServerEnv();
  }
  return cachedEnv;
}

export { serverEnvSchema, type ServerEnv };
