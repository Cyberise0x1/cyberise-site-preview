import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

vi.mock("../utils/env", () => ({
  env: {
    LINODE_API_URL: "https://api.linode.com/v4",
    LINODE_API_TOKEN: "test-token",
    REDIS_URL: "",
    NOWPAYMENTS_API_KEY: "k",
    NOWPAYMENTS_API_URL: "https://api.nowpayments.io",
    NOWPAYMENTS_IPN_SECRET: "s",
  },
}));

vi.mock("@workspace/db", () => ({
  prisma: {
    marketSettings: { findMany: vi.fn().mockResolvedValue([]) },
    order: { count: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  },
  OrderStatus: {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    FAILED: "FAILED",
  },
}));

vi.mock("../services/linode", () => ({
  getPlans: vi.fn().mockResolvedValue([
    {
      id: "g6-nanode-1",
      label: "Nanode 1 GB",
      disk: 25600,
      ram: 1024,
      vcpus: 1,
      gpus: 0,
      network_out: 1000,
      transfer: 1000,
      price: { hourly: 0.0075, monthly: 5 },
      class: "nanode",
    },
  ]),
  getSharedCPUPlans: vi.fn().mockResolvedValue([]),
  getRegions: vi.fn().mockResolvedValue([
    {
      id: "us-east",
      label: "Newark, NJ, USA",
      country: "us",
      capabilities: ["Linodes"],
      status: "ok",
      resolvers: { ipv4: "1.1.1.1", ipv6: "::1" },
    },
  ]),
  getLinuxImages: vi.fn().mockReturnValue([
    {
      id: "linode/debian12",
      label: "Debian 12",
      description: "Debian 12 (Bookworm)",
      size: 1536,
      status: "available",
      type: "manual",
      vendor: "Debian",
      deprecated: false,
    },
    {
      id: "linode/ubuntu24.04",
      label: "Ubuntu 24.04 LTS",
      description: "Ubuntu 24.04 LTS (Noble Numbat)",
      size: 1536,
      status: "available",
      type: "manual",
      vendor: "Ubuntu",
      deprecated: false,
    },
  ]),
  deleteInstance: vi.fn(),
  createInstance: vi.fn(),
}));

vi.mock("../services/rdpmonster", () => ({
  getProPlans: vi.fn().mockResolvedValue([]),
  getProRegions: vi.fn().mockResolvedValue([]),
  deleteProInstance: vi.fn(),
  createProInstance: vi.fn(),
}));

vi.mock("../services/redis", () => ({
  getCache: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../services/email", () => ({
  sendEmail: vi.fn(),
  generateRDPCredentialsEmail: vi.fn(),
  generateSSHCredentialsEmail: vi.fn(),
}));

vi.mock("../utils/encryption", () => ({
  encrypt: vi.fn().mockReturnValue("encrypted"),
  generatePassword: vi.fn().mockReturnValue("pw-fixed"),
}));

vi.mock("../services/provisioning", () => ({
  provisionInstance: vi.fn(),
  calculatePrice: vi.fn(),
}));

vi.mock("../services/promoCode", () => ({
  validatePromoCode: vi.fn(),
  applyPromoCode: vi.fn(),
  applyDiscount: vi.fn(),
}));

vi.mock("../services/nowpayments", () => ({
  getCurrencies: vi.fn(),
  getEstimate: vi.fn(),
  createPayment: vi.fn(),
  getPaymentStatus: vi.fn(),
}));

vi.mock("../middleware/auth", () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  attachUser: (
    req: { user?: unknown },
    _res: unknown,
    next: () => void,
  ) => {
    req.user = { id: "user-1", balance: 1000, email: "test@example.com" };
    next();
  },
  requireActiveUser: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../middleware/rateLimit", () => ({
  marketRateLimit: (_req: unknown, _res: unknown, next: () => void) => next(),
  orderRateLimit: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../validators/market", () => ({
  createOrderSchema: { safeParse: vi.fn() },
  validatePromoSchema: { safeParse: vi.fn() },
}));

vi.mock("../validators/crypto", () => ({
  cryptoOrderSchema: { safeParse: vi.fn() },
  estimateSchema: { safeParse: vi.fn() },
}));

vi.mock("../lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import marketRouter from "./market";
import { OrderStatus, prisma } from "@workspace/db";
import { createOrderSchema } from "../validators/market";
import { cryptoOrderSchema } from "../validators/crypto";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api", marketRouter);
  server = createServer(app);
  await new Promise<void>((resolve) =>
    server.listen(0, "127.0.0.1", resolve),
  );
  const port = (server.address() as AddressInfo).port;
  baseUrl = `http://127.0.0.1:${port}/api`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

describe("GET /market/plans — images array", () => {
  it("responds with 200 and a success body", async () => {
    const res = await fetch(`${baseUrl}/market/plans`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it("includes an images array in the response data", async () => {
    const res = await fetch(`${baseUrl}/market/plans`);
    const body = (await res.json()) as { data: { images: unknown } };
    expect(Array.isArray(body.data.images)).toBe(true);
  });

  it("images array is non-empty", async () => {
    const res = await fetch(`${baseUrl}/market/plans`);
    const body = (await res.json()) as { data: { images: unknown[] } };
    expect(body.data.images.length).toBeGreaterThan(0);
  });

  it("every image entry has an id starting with 'linode/'", async () => {
    const res = await fetch(`${baseUrl}/market/plans`);
    const body = (await res.json()) as {
      data: { images: Array<{ id: string }> };
    };
    for (const img of body.data.images) {
      expect(img.id).toMatch(/^linode\//);
    }
  });

  it("every image entry has a non-empty label", async () => {
    const res = await fetch(`${baseUrl}/market/plans`);
    const body = (await res.json()) as {
      data: { images: Array<{ label: string }> };
    };
    for (const img of body.data.images) {
      expect(img.label.length).toBeGreaterThan(0);
    }
  });

  it("contains the expected distro IDs from the mock", async () => {
    const res = await fetch(`${baseUrl}/market/plans`);
    const body = (await res.json()) as {
      data: { images: Array<{ id: string }> };
    };
    const ids = body.data.images.map((img) => img.id);
    expect(ids).toContain("linode/debian12");
    expect(ids).toContain("linode/ubuntu24.04");
  });

  it("also returns plans and regions alongside images", async () => {
    const res = await fetch(`${baseUrl}/market/plans`);
    const body = (await res.json()) as {
      data: { plans: unknown[]; regions: unknown[]; images: unknown[] };
    };
    expect(Array.isArray(body.data.plans)).toBe(true);
    expect(Array.isArray(body.data.regions)).toBe(true);
  });
});

describe("active order limit", () => {
  it("excludes FAILED orders when checking balance orders", async () => {
    vi.mocked(createOrderSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        plan: "g6-nanode-1",
        region: "us-east",
        image: "linode/ubuntu24.04",
        durationDays: 30,
        tier: "basic",
      },
    });
    vi.mocked(prisma.order.count).mockResolvedValue(5);

    const res = await fetch(`${baseUrl}/market/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: "g6-nanode-1",
        region: "us-east",
        durationDays: 30,
        tier: "basic",
      }),
    });

    expect(res.status).toBe(400);
    expect(prisma.order.count).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        status: { in: [OrderStatus.PENDING, OrderStatus.ACTIVE] },
      },
    });
  });

  it("excludes FAILED orders when checking crypto orders", async () => {
    vi.mocked(cryptoOrderSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        plan: "g6-nanode-1",
        region: "us-east",
        image: "linode/ubuntu24.04",
        durationDays: 30,
        tier: "basic",
        payCurrency: "btc",
      },
    });
    vi.mocked(prisma.order.count).mockResolvedValue(5);

    const res = await fetch(`${baseUrl}/market/crypto/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: "g6-nanode-1",
        region: "us-east",
        durationDays: 30,
        tier: "basic",
        payCurrency: "btc",
      }),
    });

    expect(res.status).toBe(400);
    expect(prisma.order.count).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        status: { in: [OrderStatus.PENDING, OrderStatus.ACTIVE] },
      },
    });
  });
});
