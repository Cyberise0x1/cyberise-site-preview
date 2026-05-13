import { Redis } from "@upstash/redis";

const globalForRedis = globalThis;
const redis = globalForRedis.__redis ?? new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});
if (process.env.NODE_ENV !== "production") globalForRedis.__redis = redis;

export default redis;

export async function getCache(key) {
  const value = await redis.get(key);
  return value ?? null;
}

export async function setCache(key, value, ttl = 300) {
  await redis.set(key, value, { ex: ttl });
}

export async function deleteCache(key) {
  await redis.del(key);
}
