import { createServer, type Server } from "node:http";
import express from "express";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  orderFindMany: vi.fn(),
  orderUpdateMany: vi.fn(),
  auditLogCreate: vi.fn(),
  deleteInstance: vi.fn(),
  isLinuxImageId: vi.fn(),
  sendEmail: vi.fn(),
  generateTerminationEmail: vi.fn(),
  generateRenewalReminderEmail: vi.fn(),
  loggerError: vi.fn(),
  loggerInfo: vi.fn(),
  loggerWarn: vi.fn(),
  loggerDebug: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  prisma: {
    order: {
      findMany: mocks.orderFindMany,
      updateMany: mocks.orderUpdateMany,
    },
    auditLog: { create: mocks.auditLogCreate },
  },
  OrderStatus: { ACTIVE: "ACTIVE", TERMINATED: "TERMINATED" },
}));

vi.mock("../services/linode", () => ({
  deleteInstance: mocks.deleteInstance,
  isLinuxImageId: mocks.isLinuxImageId,
}));

vi.mock("../services/email", () => ({
  sendEmail: mocks.sendEmail,
  generateTerminationEmail: mocks.generateTerminationEmail,
  generateRenewalReminderEmail: mocks.generateRenewalReminderEmail,
}));

vi.mock("../lib/logger", () => ({
  logger: {
    error: mocks.loggerError,
    info: mocks.loggerInfo,
    warn: mocks.loggerWarn,
    debug: mocks.loggerDebug,
  },
}));

import cronRouter from "./cron";

const SECRET = "expiry-cron-test-secret";

interface ExpiredOrder {
  id: string;
  userId: string;
  image: string;
  ip: string | null;
  linodeInstanceId: number | null;
  user: { email: string };
}

function makeExpiredOrder(
  overrides: Partial<ExpiredOrder> = {},
): ExpiredOrder {
  return {
    id: "order-1",
    userId: "user-1",
    image: "linode/ubuntu22.04",
    ip: "203.0.113.24",
    linodeInstanceId: null,
    user: { email: "owner@example.com" },
    ...overrides,
  };
}

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(cronRouter);
  server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Cron test server did not bind to a TCP port");
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (server.listening) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

beforeEach(() => {
  process.env.CRON_SECRET = SECRET;
  vi.clearAllMocks();

  mocks.orderFindMany.mockResolvedValue([]);
  mocks.orderUpdateMany.mockResolvedValue({ count: 1 });
  mocks.auditLogCreate.mockResolvedValue({});
  mocks.deleteInstance.mockResolvedValue(undefined);
  mocks.isLinuxImageId.mockImplementation(
    (imageId: string) => imageId === "linode/ubuntu22.04",
  );
  mocks.sendEmail.mockResolvedValue({ success: true });
  mocks.generateTerminationEmail.mockImplementation(
    ({ connectionType }: { connectionType: "SSH" | "RDP" }) => ({
      html: `${connectionType} termination`,
      text: `${connectionType} termination`,
    }),
  );
  mocks.generateRenewalReminderEmail.mockReturnValue({ html: "", text: "" });
});

afterAll(() => {
  delete process.env.CRON_SECRET;
});

async function runExpiryCron(): Promise<Response> {
  return fetch(`${baseUrl}/cron/expire-instances`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SECRET}` },
  });
}

describe("expired order termination notifications", () => {
  it("sends an SSH termination email for a Linux order", async () => {
    const order = makeExpiredOrder();
    mocks.orderFindMany
      .mockResolvedValueOnce([order])
      .mockResolvedValueOnce([]);

    const response = await runExpiryCron();
    const payload = (await response.json()) as {
      data: { terminated: number };
    };

    expect(response.status).toBe(200);
    expect(payload.data.terminated).toBe(1);
    expect(mocks.generateTerminationEmail).toHaveBeenCalledWith({
      ip: order.ip,
      terminatedAt: expect.any(Date),
      connectionType: "SSH",
    });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: order.user.email,
        subject: "SSH Service Terminated - Cyberise",
        userId: order.userId,
      }),
    );
  });

  it("sends an RDP termination email for a Windows order", async () => {
    const order = makeExpiredOrder({
      id: "windows-order",
      image: "private/windows-image",
    });
    mocks.orderFindMany
      .mockResolvedValueOnce([order])
      .mockResolvedValueOnce([]);

    const response = await runExpiryCron();
    const payload = (await response.json()) as {
      data: { terminated: number };
    };

    expect(response.status).toBe(200);
    expect(payload.data.terminated).toBe(1);
    expect(mocks.generateTerminationEmail).toHaveBeenCalledWith({
      ip: order.ip,
      terminatedAt: expect.any(Date),
      connectionType: "RDP",
    });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: order.user.email,
        subject: "RDP Service Terminated - Cyberise",
        userId: order.userId,
      }),
    );
  });

  it("logs an email failure and continues processing other expired orders", async () => {
    const linuxOrder = makeExpiredOrder();
    const windowsOrder = makeExpiredOrder({
      id: "windows-order",
      image: "private/windows-image",
    });
    mocks.orderFindMany
      .mockResolvedValueOnce([linuxOrder, windowsOrder])
      .mockResolvedValueOnce([]);
    mocks.sendEmail
      .mockResolvedValueOnce({
        success: false,
        error: "Email provider unavailable",
      })
      .mockResolvedValueOnce({ success: true });

    const response = await runExpiryCron();
    const payload = (await response.json()) as {
      data: { terminated: number };
    };

    expect(payload.data.terminated).toBe(2);
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Email provider unavailable",
        orderId: linuxOrder.id,
      }),
      "Failed to send expiry termination email",
    );
  });

  it("sends only one notification when concurrent cron runs claim the same order", async () => {
    const order = makeExpiredOrder();
    mocks.orderFindMany.mockImplementation(
      (args: { where: { expiresAt: { gt?: Date; lt?: Date } } }) => {
        if (args.where.expiresAt.gt) return Promise.resolve([]);
        return Promise.resolve([order]);
      },
    );
    mocks.orderUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const responses = await Promise.all([runExpiryCron(), runExpiryCron()]);
    const payloads = await Promise.all(
      responses.map(
        async (response) =>
          (await response.json()) as { data: { terminated: number } },
      ),
    );

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(payloads.reduce((total, payload) => total + payload.data.terminated, 0))
      .toBe(1);
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.auditLogCreate).toHaveBeenCalledTimes(1);
  });
});