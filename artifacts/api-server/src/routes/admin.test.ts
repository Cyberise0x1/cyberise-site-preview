import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

vi.mock("@workspace/db", () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    credentialEmailDelivery: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {},
    auditLog: { create: vi.fn() },
    marketSettings: { findMany: vi.fn(), upsert: vi.fn() },
    promoCode: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  OrderStatus: {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    TERMINATED: "TERMINATED",
    FAILED: "FAILED",
  },
}));

vi.mock("../middleware/auth", () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  attachUser: (req: { user?: unknown }, _res: unknown, next: () => void) => {
    req.user = {
      id: "admin-1",
      email: "admin@example.com",
      role: "ADMIN",
      balance: 0,
      banned: false,
    };
    next();
  },
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../services/linode", () => ({ deleteInstance: vi.fn() }));
vi.mock("../services/redis", () => ({ deleteCache: vi.fn() }));
vi.mock("../lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { prisma } from "@workspace/db";
import adminRouter from "./admin";

const mockCredentialEmailDelivery =
  prisma.credentialEmailDelivery as unknown as {
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };

const mockOrder = prisma.order as unknown as {
  findMany: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
};

type ListedOrder = {
  id: string;
  userId: string;
  status: string;
  metadata: Record<string, unknown> | null;
  failedOrderCount: number;
  user: { email: string };
};

type OrdersResponse = {
  success: boolean;
  data?: {
    orders: ListedOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
  details?: Record<string, unknown>;
};

type CredentialEmailDeliveriesResponse = {
  success: boolean;
  data?: {
    deliveries: Array<{
      id: string;
      orderId: string;
      status: string;
      attempts: number;
      lastAttemptAt: string | null;
      order: { plan: string; region: string };
      errorSummary: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use("/api", adminRouter);
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

beforeEach(() => {
  vi.clearAllMocks();
  mockOrder.findMany.mockResolvedValue([]);
  mockOrder.count.mockResolvedValue(0);
  mockOrder.groupBy.mockResolvedValue([]);
  mockCredentialEmailDelivery.findMany.mockResolvedValue([]);
  mockCredentialEmailDelivery.count.mockResolvedValue(0);
});

function makeOrder(
  overrides: Partial<{
    id: string;
    userId: string;
    status: string;
    metadata: Record<string, unknown> | null;
  }> = {},
) {
  return {
    id: "order-1",
    userId: "user-1",
    plan: "g6-nanode-1",
    region: "us-east",
    image: "linode/ubuntu24.04",
    ip: null,
    status: "PENDING",
    amount: "5.00",
    createdAt: new Date("2026-09-25T12:00:00.000Z"),
    expiresAt: null,
    linodeInstanceId: null,
    metadata: null,
    user: { email: "customer@example.com" },
    ...overrides,
  };
}

async function getOrders(query = "") {
  const response = await fetch(`${baseUrl}/admin/orders${query}`);
  return {
    response,
    body: (await response.json()) as OrdersResponse,
  };
}

async function getCredentialEmailDeliveries(query = "") {
  const response = await fetch(
    `${baseUrl}/admin/credential-email-deliveries${query}`,
  );
  return {
    response,
    body: (await response.json()) as CredentialEmailDeliveriesResponse,
  };
}

describe("GET /admin/orders", () => {
  it("filters FAILED orders and returns recorded or null failure metadata safely", async () => {
    const failureMetadata = {
      linodeError: "Linode rejected the requested image",
      source: "provisioning",
    };
    mockOrder.findMany.mockResolvedValue([
      makeOrder({
        id: "failed-order-1",
        status: "FAILED",
        metadata: failureMetadata,
      }),
      makeOrder({
        id: "failed-order-2",
        status: "FAILED",
        metadata: null,
      }),
    ]);
    mockOrder.count.mockResolvedValue(2);
    mockOrder.groupBy.mockResolvedValue([
      { userId: "user-1", _count: { _all: 2 } },
    ]);

    const { response, body } = await getOrders("?status=FAILED");

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data?.orders).toEqual([
      expect.objectContaining({
        id: "failed-order-1",
        status: "FAILED",
        metadata: failureMetadata,
        failedOrderCount: 2,
      }),
      expect.objectContaining({
        id: "failed-order-2",
        status: "FAILED",
        metadata: null,
        failedOrderCount: 2,
      }),
    ]);
    expect(mockOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "FAILED" } }),
    );
    expect(mockOrder.count).toHaveBeenCalledWith({
      where: { status: "FAILED" },
    });
  });

  it("rejects an unsupported status without querying orders", async () => {
    const { response, body } = await getOrders("?status=PROVISIONING");

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      success: false,
      error: "Validation failed",
    });
    expect(body.details?.status).toBeDefined();
    expect(mockOrder.findMany).not.toHaveBeenCalled();
    expect(mockOrder.count).not.toHaveBeenCalled();
    expect(mockOrder.groupBy).not.toHaveBeenCalled();
  });

  it("counts all failed orders for each listed user, not just failures on the current page", async () => {
    mockOrder.findMany.mockResolvedValue([
      makeOrder({ id: "current-page-order", status: "ACTIVE" }),
    ]);
    mockOrder.count.mockResolvedValue(8);
    mockOrder.groupBy.mockResolvedValue([
      { userId: "user-1", _count: { _all: 5 } },
    ]);

    const { response, body } = await getOrders("?page=2&limit=1");

    expect(response.status).toBe(200);
    expect(body.data?.orders).toEqual([
      expect.objectContaining({
        id: "current-page-order",
        failedOrderCount: 5,
      }),
    ]);
    expect(mockOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 1, take: 1 }),
    );
    expect(mockOrder.groupBy).toHaveBeenCalledWith({
      by: ["userId"],
      where: {
        userId: { in: ["user-1"] },
        status: "FAILED",
      },
      _count: { _all: true },
    });
  });

  it("returns an empty page safely and skips the failed-order count query", async () => {
    const { response, body } = await getOrders();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        orders: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
    });
    expect(mockOrder.groupBy).not.toHaveBeenCalled();
  });
});

describe("GET /admin/credential-email-deliveries", () => {
  it("lists unresolved deliveries without returning stored errors or credentials", async () => {
    const lastAttemptAt = new Date("2026-09-25T12:30:00.000Z");
    mockCredentialEmailDelivery.findMany.mockResolvedValue([
      {
        id: "delivery-1",
        orderId: "failed-order-1",
        status: "FAILED",
        attempts: 3,
        lastAttemptAt,
        order: { plan: "g6-nanode-1", region: "us-east" },
      },
      {
        id: "delivery-2",
        orderId: "pending-order-1",
        status: "PENDING",
        attempts: 0,
        lastAttemptAt: null,
        order: { plan: "g6-nanode-2", region: "us-west" },
      },
    ]);
    mockCredentialEmailDelivery.count.mockResolvedValue(2);

    const { response, body } = await getCredentialEmailDeliveries();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data?.deliveries).toEqual([
      {
        id: "delivery-1",
        orderId: "failed-order-1",
        status: "FAILED",
        attempts: 3,
        lastAttemptAt: lastAttemptAt.toISOString(),
        order: { plan: "g6-nanode-1", region: "us-east" },
        errorSummary:
          "The last delivery attempt failed. Sensitive error details are hidden.",
      },
      {
        id: "delivery-2",
        orderId: "pending-order-1",
        status: "PENDING",
        attempts: 0,
        lastAttemptAt: null,
        order: { plan: "g6-nanode-2", region: "us-west" },
        errorSummary: "Waiting for the first delivery attempt.",
      },
    ]);
    expect(mockCredentialEmailDelivery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ["PENDING", "FAILED"] } },
        skip: 0,
        take: 20,
      }),
    );
    expect(JSON.stringify(body)).not.toContain("lastError");
    expect(JSON.stringify(body)).not.toContain("rdpPassword");
    expect(JSON.stringify(body)).not.toContain("password");
    expect(mockCredentialEmailDelivery.count).toHaveBeenCalledWith({
      where: { status: { in: ["PENDING", "FAILED"] } },
    });
  });

  it("validates pagination before querying the outbox", async () => {
    const { response } = await getCredentialEmailDeliveries("?page=0");

    expect(response.status).toBe(400);
    expect(mockCredentialEmailDelivery.findMany).not.toHaveBeenCalled();
    expect(mockCredentialEmailDelivery.count).not.toHaveBeenCalled();
  });
});
