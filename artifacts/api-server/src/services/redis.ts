import { Redis } from "@upstash/redis";
import { env } from "../utils/env";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: env.REDIS_URL,
      token: env.REDIS_TOKEN,
    });
  }
  return redis;
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedis();
  const value = await client.get<T>(key);
  return value ?? null;
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds = 300,
): Promise<void> {
  const client = getRedis();
  await client.set(key, value, { ex: ttlSeconds });
}

export async function deleteCache(key: string): Promise<void> {
  const client = getRedis();
  await client.del(key);
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds = 60,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const key = `rate_limit:${endpoint}:${identifier}`;
  const client = getRedis();

  const current = (await client.get<number>(key)) ?? 0;
  const ttl = await client.ttl(key);

  const resetAt = new Date(Date.now() + (ttl > 0 ? ttl : windowSeconds) * 1000);

  if (current >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining: maxRequests - current - 1, resetAt };
}
