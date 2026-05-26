import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import type { Request, Response, NextFunction } from "express";
import { prisma, UserRole } from "@workspace/db";
import { sendUnauthorized, sendForbidden, sendError } from "../utils/responses";
import { logger } from "../lib/logger";

export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
  };
  user?: {
    id: string;
    email: string;
    role: UserRole;
    balance: number;
    banned: boolean;
  };
}

const clerkRequireAuth = ClerkExpressRequireAuth();

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  clerkRequireAuth(req, res, (err?: unknown) => {
    if (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        "Authentication failed",
      );
      sendUnauthorized(res);
      return;
    }
    next();
  });
}

export async function attachUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.auth?.userId) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
    });

    if (!user) {
      sendUnauthorized(res, "User not found");
      return;
    }

    if (user.banned) {
      sendForbidden(res, "Account suspended");
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      balance: Number(user.balance),
      banned: user.banned,
    };

    next();
  } catch (error) {
    logger.error({ error }, "Error attaching user");
    sendError(res, "Internal server error");
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    sendUnauthorized(res);
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    sendForbidden(res, "Admin access required");
    return;
  }

  next();
}

export function requireActiveUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    sendUnauthorized(res);
    return;
  }

  if (req.user.banned) {
    sendForbidden(res, "Account suspended");
    return;
  }

  next();
}
