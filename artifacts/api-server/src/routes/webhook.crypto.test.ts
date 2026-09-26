import { createServer, type Server } from "node:http";
import express, { type Request } from "express";
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
  cryptoPaymentFindUnique: vi.fn(),
  cryptoPaymentUpdate: vi.fn(),
  orderUpdate: vi.fn(),
  marketSettingsFindMany: vi.fn(),
  userFindUnique: vi.fn(),
  auditLogCreate: vi.fn(),
  verifyIpnSignature: vi.fn(),
  provisionInstance: vi.fn(),
  encrypt: vi.fn(),
  sendEmail: vi.fn(),
  loggerError: vi.fn(),
  loggerInfo: vi.fn(),
  loggerWarn: vi.fn(),
  loggerDebug: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  prisma: {
    cryptoPayment: {
      findUnique: mocks.cryptoPaymentFindUnique,
      update: mocks.cryptoPaymentUpdate,
    },
    order: { update: mocks.orderUpdate },
    marketSettings: { findMany: mocks.marketSettingsFindMany },
    user: { findUnique: mocks.userFindUnique },
    auditLog: { create: mocks.auditLogCreate },
  },
  OrderStatus: {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    FAILED: "FAILED",
  },
  UserRole: { USER: "USER", ADMIN: "ADMIN" },
}));

vi.mock("../utils/env", () => ({
  env: {
    CLERK_WEBHOOK_SECRET: "test-clerk-secret",
    RESEND_API_KEY: "test-resend-key",
    RESEND_SENDER_ADDRESS: "sender@example.com",
  },
}));

vi.mock("../lib/logger", () => ({
  logger: {
    error: mocks.loggerError,
    info: mocks.loggerInfo,
    warn: mocks.loggerWarn,
    debug: mocks.loggerDebug,
  },
}));

vi.mock("../services/nowpayments", () => ({
  verifyIpnSignature: mocks.verifyIpnSignature,
}));

vi.mock("../services/provisioning", () => ({
  provisionInstance: mocks.provisionInstance,
}));

vi.mock("../utils/encryption", () => ({
  encrypt: mocks.encrypt,
}));

vi.mock("../services/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/email")>();
  return { ...actual, sendEmail: mocks.sendEmail };
});

import webhookRouter from "./webhook";

const PAYMENT_ID = "crypto-payment-linux-1";
const PAYMENT_STATUS = "confirmed";
const USER_ID = "user-linux-1";
const ORDER_ID = "order-linux-1";
const IP = "203.0.113.24";
const USERNAME = "root";
const PASSWORD = "linux-root-password";
const EXPIRES_AT = new Date("2027-01-15T12:00:00.000Z");
const SECRET_SIGNATURE = "valid-ipn-signature";
const SECRET_BODY = {
  payment_id: PAYMENT_ID,
  payment_status: PAYMENT_STATUS,
  price_amount: 25,
  pay_amount: 0.001,
  actually_paid: 25,
};

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(
    express.json({
      verify: (req, _res, buffer) => {
        (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
      },
    }),
  );
  app.use(webhookRouter);
  server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Webhook test server did not bind to a TCP port");
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
  vi.clearAllMocks();

  mocks.verifyIpnSignature.mockReturnValue(true);
  mocks.cryptoPaymentFindUnique.mockResolvedValue({
    id: "crypto-payment-row-1",
    order: {
      id: ORDER_ID,
      userId: USER_ID,
      status: "PENDING",
      plan: "g6-nanode-1",
      region: "us-east",
      image: "linode/ubuntu22.04",
      durationDays: 30,
      metadata: { tier: "basic", paymentMethod: "crypto" },
    },
  });
  mocks.cryptoPaymentUpdate.mockResolvedValue({});
  mocks.orderUpdate.mockResolvedValue({});
  mocks.marketSettingsFindMany.mockResolvedValue([]);
  mocks.userFindUnique.mockResolvedValue({
    id: USER_ID,
    email: "linux-owner@example.com",
  });
  mocks.auditLogCreate.mockResolvedValue({});
  mocks.provisionInstance.mockResolvedValue({
    ip: IP,
    username: USERNAME,
    password: PASSWORD,
    expiresAt: EXPIRES_AT,
    instanceId: 12345,
  });
  mocks.encrypt.mockReturnValue("encrypted-linux-password");
  mocks.sendEmail.mockResolvedValue({ success: true });
});

describe("NowPayments Linux order credentials email", () => {
  it("provisions a Linux crypto order and sends the provisioned SSH credentials", async () => {
    const rawBody = JSON.stringify(SECRET_BODY);
    const response = await fetch(`${baseUrl}/webhooks/nowpayments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-nowpayments-sig": SECRET_SIGNATURE,
      },
      body: rawBody,
    });
    const payload = (await response.json()) as {
      success: boolean;
      data?: { received: boolean };
    };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true, data: { received: true } });
    expect(mocks.verifyIpnSignature).toHaveBeenCalledWith(
      rawBody,
      SECRET_SIGNATURE,
    );
    expect(mocks.provisionInstance).toHaveBeenCalledWith({
      plan: "g6-nanode-1",
      region: "us-east",
      image: "linode/ubuntu22.04",
      tier: "basic",
      userId: USER_ID,
      durationDays: 30,
      markupPercent: 20,
    });
    expect(mocks.orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ORDER_ID },
        data: expect.objectContaining({
          status: "ACTIVE",
          ip: IP,
          rdpUsername: USERNAME,
          rdpPasswordEncrypted: "encrypted-linux-password",
        }),
      }),
    );
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "linux-owner@example.com",
        subject: "Your Linux Server Credentials — Cyberise",
        userId: USER_ID,
        html: expect.stringContaining("SSH Command"),
        text: expect.stringContaining(`SSH Command: ssh ${USERNAME}@${IP}`),
      }),
    );

    const email = mocks.sendEmail.mock.calls[0]?.[0] as {
      html: string;
      text: string;
    };
    expect(email.html).toContain(USERNAME);
    expect(email.html).toContain(PASSWORD);
    expect(email.text).toContain(USERNAME);
    expect(email.text).toContain(PASSWORD);
    expect(email.text).not.toContain("RDP is Ready");
  });
});