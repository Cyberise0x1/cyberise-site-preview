import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@workspace/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  },
  OrderStatus: {},
  UserRole: { USER: "USER", ADMIN: "ADMIN" },
}));
vi.mock("../utils/env", () => ({
  env: { CLERK_WEBHOOK_SECRET: "whsec_test" },
}));
vi.mock("../utils/responses", () => ({
  sendSuccess: vi.fn(),
  sendError: vi.fn(),
}));
vi.mock("../lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("../services/nowpayments", () => ({ verifyIpnSignature: vi.fn() }));
vi.mock("../services/provisioning", () => ({ provisionInstance: vi.fn() }));
vi.mock("../utils/encryption", () => ({ encrypt: vi.fn() }));
vi.mock("../services/email", () => ({
  sendEmail: vi.fn(),
  generateRDPCredentialsEmail: vi.fn(),
}));

import { prisma, UserRole } from "@workspace/db";
import { logger } from "../lib/logger";
import {
  resolveRole,
  extractPrimaryEmail,
  syncUserFromClerk,
  softDeleteUser,
} from "./webhook";

// Typed handles to the mocked prisma methods.
const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  auditLog: { create: ReturnType<typeof vi.fn> };
};

const userEvent = (
  id: string,
  role?: unknown,
  email = "u@example.com",
): {
  id: string;
  email_addresses?: Array<{ email_address: string }>;
  primary_email_address_id?: string;
  public_metadata?: { role?: unknown } & Record<string, unknown>;
  [key: string]: unknown;
} => ({
  id,
  email_addresses: [{ email_address: email }],
  primary_email_address_id: undefined,
  public_metadata: role === undefined ? {} : { role },
});

describe("resolveRole (strict mirror)", () => {
  it("returns ADMIN only for exactly 'ADMIN'", () => {
    expect(resolveRole({ role: "ADMIN" })).toBe(UserRole.ADMIN);
  });

  it("returns USER for missing, lowercase, garbage, or absent metadata", () => {
    expect(resolveRole({})).toBe(UserRole.USER);
    expect(resolveRole({ role: "admin" })).toBe(UserRole.USER);
    expect(resolveRole({ role: "superuser" })).toBe(UserRole.USER);
    expect(resolveRole(null)).toBe(UserRole.USER);
    expect(resolveRole(undefined)).toBe(UserRole.USER);
  });
});

describe("extractPrimaryEmail", () => {
  it("prefers the primary address (matched by Clerk email id)", () => {
    expect(
      extractPrimaryEmail({
        id: "u_1",
        email_addresses: [
          { id: "idn_first", email_address: "first@example.com" },
          { id: "idn_primary", email_address: "primary@example.com" },
        ],
        primary_email_address_id: "idn_primary",
      }),
    ).toBe("primary@example.com");
  });

  it("falls back to the first address when no primary id matches", () => {
    expect(
      extractPrimaryEmail({
        id: "u_1",
        email_addresses: [
          { id: "idn_a", email_address: "first@example.com" },
          { id: "idn_b", email_address: "second@example.com" },
        ],
        primary_email_address_id: "idn_missing",
      }),
    ).toBe("first@example.com");
  });

  it("falls back to the first address when there is a single one", () => {
    expect(
      extractPrimaryEmail({
        id: "u_1",
        email_addresses: [{ id: "idn_a", email_address: "only@example.com" }],
      }),
    ).toBe("only@example.com");
  });

  it("returns undefined when there are no addresses", () => {
    expect(extractPrimaryEmail({ id: "u_1" })).toBeUndefined();
  });
});

describe("syncUserFromClerk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("promotes an existing USER to ADMIN and writes an audit log", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u_1",
      role: UserRole.USER,
    });

    await syncUserFromClerk(userEvent("u_1", "ADMIN"));

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "u_1" },
      data: { role: UserRole.ADMIN, email: "u@example.com" },
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: "u_1",
        action: "USER_ROLE_SYNCED",
        entity: "User",
        entityId: "u_1",
        metadata: {
          from: UserRole.USER,
          to: UserRole.ADMIN,
          source: "clerk_webhook",
        },
      },
    });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("demotes an existing ADMIN to USER when the role flag is gone (strict mirror)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u_1",
      role: UserRole.ADMIN,
    });

    await syncUserFromClerk(userEvent("u_1", undefined));

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "u_1" },
      data: { role: UserRole.USER, email: "u@example.com" },
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("does not write an audit log when the role is unchanged", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u_1",
      role: UserRole.ADMIN,
    });

    await syncUserFromClerk(userEvent("u_1", "ADMIN"));

    expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("creates a new row with the resolved role when none exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await syncUserFromClerk(userEvent("u_2", "ADMIN", "new@example.com"));

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        id: "u_2",
        email: "new@example.com",
        role: UserRole.ADMIN,
        balance: 0,
        banned: false,
      },
    });
    // New ADMIN row => audit log (from implicit USER).
    expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("creates a plain USER without an audit log", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await syncUserFromClerk(userEvent("u_3", undefined, "plain@example.com"));

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        id: "u_3",
        email: "plain@example.com",
        role: UserRole.USER,
        balance: 0,
        banned: false,
      },
    });
    expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("warns and skips creation when no row exists and no email is present", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await syncUserFromClerk({ id: "u_4", public_metadata: { role: "ADMIN" } });

    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe("softDeleteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bans the user and logs info when a row is updated", async () => {
    mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });

    await softDeleteUser({ id: "u_1" });

    expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "u_1" },
      data: { banned: true },
    });
    expect(logger.info).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("is an idempotent no-op (warn, no throw) for an unknown user", async () => {
    mockPrisma.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(softDeleteUser({ id: "ghost" })).resolves.toBeUndefined();

    expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "ghost" },
      data: { banned: true },
    });
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
});
