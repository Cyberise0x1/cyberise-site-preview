import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockInstance,
} from "vitest";
import type { Request, Response, NextFunction } from "express";

// Capture the middleware factory's return value so each test can re-program it.
// Clerk's ClerkExpressRequireAuth() returns (req, res, next) => void — on
// success calls next(), on auth failure calls next(new Error("Unauthenticated")).
// If Clerk's SDK changes that contract in a future major bump, this mock
// silently passes while prod breaks — keep an eye on @clerk/clerk-sdk-node
// upgrades and re-verify against dist/index.mjs.
const clerkMiddleware =
  vi.fn<(req: Request, res: Response, next: (err?: unknown) => void) => void>();
vi.mock("@clerk/clerk-sdk-node", () => ({
  ClerkExpressRequireAuth: () => clerkMiddleware,
}));

const findUnique = vi.fn();
vi.mock("@workspace/db", () => ({
  prisma: { user: { findUnique } },
  UserRole: { ADMIN: "ADMIN", USER: "USER" },
}));

// Silence pino during tests
vi.mock("../lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { requireAuth, attachUser, requireAdmin, requireActiveUser } =
  await import("./auth");

type MockedRes = Response & {
  status: MockInstance;
  json: MockInstance;
};

function mockRes(): MockedRes {
  const res = {} as MockedRes;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth", () => {
  it("calls next() when Clerk middleware succeeds", () => {
    clerkMiddleware.mockImplementation((_req, _res, next) => next());
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("sends 401 JSON when Clerk passes an Error to next()", () => {
    clerkMiddleware.mockImplementation((_req, _res, next) =>
      next(new Error("Unauthenticated")),
    );
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: "Unauthorized" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("sends 401 JSON when Clerk passes a non-Error to next()", () => {
    clerkMiddleware.mockImplementation((_req, _res, next) =>
      next("string-err"),
    );
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: "Unauthorized" }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});

describe("attachUser", () => {
  it("passes through when req.auth.userId is missing", async () => {
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await attachUser(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(findUnique).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("populates req.user and calls next() for an active user", async () => {
    findUnique.mockResolvedValueOnce({
      id: "u_1",
      email: "a@b.co",
      role: "USER",
      balance: 42,
      banned: false,
    });
    const req = { auth: { userId: "u_1" } } as unknown as Request & {
      user?: unknown;
    };
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await attachUser(req as Request, res, next);

    expect(findUnique).toHaveBeenCalledWith({ where: { id: "u_1" } });
    expect(req.user).toEqual({
      id: "u_1",
      email: "a@b.co",
      role: "USER",
      balance: 42,
      banned: false,
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("sends 401 when the user is not in the DB", async () => {
    findUnique.mockResolvedValueOnce(null);
    const req = { auth: { userId: "u_missing" } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await attachUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: "User not found" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("sends 403 when the user is banned", async () => {
    findUnique.mockResolvedValueOnce({
      id: "u_2",
      email: "bad@b.co",
      role: "USER",
      balance: 0,
      banned: true,
    });
    const req = { auth: { userId: "u_2" } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await attachUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Account suspended",
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("sends 500 when prisma throws", async () => {
    findUnique.mockRejectedValueOnce(new Error("db down"));
    const req = { auth: { userId: "u_3" } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await attachUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Internal server error",
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireAdmin", () => {
  it("sends 401 when req.user is missing", () => {
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("sends 403 when role is not ADMIN", () => {
    const req = {
      user: { id: "u", email: "a@b", role: "USER", balance: 0, banned: false },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Admin access required",
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when role is ADMIN", () => {
    const req = {
      user: { id: "u", email: "a@b", role: "ADMIN", balance: 0, banned: false },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("requireActiveUser", () => {
  it("sends 401 when req.user is missing", () => {
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireActiveUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("sends 403 when the user is banned", () => {
    const req = {
      user: { id: "u", email: "a@b", role: "USER", balance: 0, banned: true },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireActiveUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Account suspended",
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() for an active user", () => {
    const req = {
      user: { id: "u", email: "a@b", role: "USER", balance: 0, banned: false },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireActiveUser(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
