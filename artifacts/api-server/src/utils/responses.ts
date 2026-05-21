import type { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, unknown>;
}

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(status).json(response);
}

export function sendError(
  res: Response,
  error: string,
  status = 500,
  details?: Record<string, unknown>,
): void {
  const response: ApiResponse = {
    success: false,
    error,
    details,
  };
  res.status(status).json(response);
}

export function sendValidationError(
  res: Response,
  details: Record<string, unknown>,
): void {
  sendError(res, "Validation failed", 400, details);
}

export function sendNotFound(res: Response, resource = "Resource"): void {
  sendError(res, `${resource} not found`, 404);
}

export function sendUnauthorized(
  res: Response,
  message = "Unauthorized",
): void {
  sendError(res, message, 401);
}

export function sendForbidden(res: Response, message = "Forbidden"): void {
  sendError(res, message, 403);
}
