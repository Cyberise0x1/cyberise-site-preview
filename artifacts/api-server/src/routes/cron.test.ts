import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@workspace/db", () => ({ prisma: {}, OrderStatus: {} }));
vi.mock("../services/linode", () => ({ deleteInstance: vi.fn() }));
vi.mock("../services/email", () => ({
  sendEmail: vi.fn(),
  generateRenewalReminderEmail: vi.fn(),
}));
vi.mock("../utils/responses", () => ({ sendSuccess: vi.fn(), sendError: vi.fn() }));
vi.mock("../lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { isAuthorizedCron } from "./cron";

const SECRET = "s3cr3t-cron-value";
const reqWith = (authorization?: string) => ({ headers: { authorization } });

describe("isAuthorizedCron (fail closed)", () => {
  beforeEach(() => {
    delete process.env.CRON_SECRET;
  });
  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("rejects when CRON_SECRET is unset, even with a 'Bearer ' header", () => {
    expect(isAuthorizedCron(reqWith("Bearer "))).toBe(false);
    expect(isAuthorizedCron(reqWith("Bearer undefined"))).toBe(false);
  });

  it("rejects when CRON_SECRET is empty string", () => {
    process.env.CRON_SECRET = "";
    expect(isAuthorizedCron(reqWith("Bearer "))).toBe(false);
  });

  it("rejects a wrong token", () => {
    process.env.CRON_SECRET = SECRET;
    expect(isAuthorizedCron(reqWith("Bearer wrong"))).toBe(false);
  });

  it("rejects a missing Authorization header", () => {
    process.env.CRON_SECRET = SECRET;
    expect(isAuthorizedCron(reqWith(undefined))).toBe(false);
  });

  it("accepts the exact matching bearer token", () => {
    process.env.CRON_SECRET = SECRET;
    expect(isAuthorizedCron(reqWith(`Bearer ${SECRET}`))).toBe(true);
  });
});
