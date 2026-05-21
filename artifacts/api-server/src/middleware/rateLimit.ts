import type { Request, Response, NextFunction } from "express";
import { checkRateLimit } from "../services/redis";
import { logger } from "../lib/logger";

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimit(config: RateLimitConfig) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const identifier = config.keyGenerator
        ? config.keyGenerator(req)
        : (req.ip ?? "anonymous");

      const endpoint = req.route?.path ?? req.path;

      const { allowed, remaining, resetAt } = await checkRateLimit(
        identifier,
        endpoint,
        config.maxRequests,
        config.windowSeconds,
      );

      res.setHeader("RateLimit-Limit", String(config.maxRequests));
      res.setHeader("RateLimit-Remaining", String(remaining));
      res.setHeader("RateLimit-Reset", resetAt.toISOString());

      if (!allowed) {
        res.setHeader(
          "Retry-After",
          String(Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
        );
        res.status(429).json({
          success: false,
          error: "Too many requests",
          details: { retryAfter: resetAt.toISOString() },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error({ error }, "Rate limit check failed");
      next();
    }
  };
}

export const marketRateLimit = createRateLimit({
  maxRequests: 30,
  windowSeconds: 60,
});

export const orderRateLimit = createRateLimit({
  maxRequests: 5,
  windowSeconds: 60,
  keyGenerator: (req) => {
    const userId = (req as unknown as { user?: { id: string } }).user?.id;
    return userId ?? req.ip ?? "anonymous";
  },
});

export const strictRateLimit = createRateLimit({
  maxRequests: 10,
  windowSeconds: 60,
});
