import { describe, it, expect, vi } from "vitest";
import crypto from "node:crypto";

const { SECRET } = vi.hoisted(() => ({ SECRET: "test-ipn-secret" }));

vi.mock("../utils/env", () => ({
  env: {
    NOWPAYMENTS_IPN_SECRET: SECRET,
    NOWPAYMENTS_API_KEY: "k",
    NOWPAYMENTS_API_URL: "https://api.nowpayments.io",
  },
}));
vi.mock("./redis", () => ({ getCache: vi.fn(), setCache: vi.fn() }));
vi.mock("../lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { verifyIpnSignature } from "./nowpayments";

// Mirror NowPayments' signing: HMAC-SHA512 over key-sorted JSON.
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return Object.keys(o)
      .sort()
      .reduce<Record<string, unknown>>((a, k) => {
        a[k] = sortKeys(o[k]);
        return a;
      }, {});
  }
  return v;
}
function sign(obj: unknown): string {
  return crypto
    .createHmac("sha512", SECRET)
    .update(JSON.stringify(sortKeys(obj)))
    .digest("hex");
}

describe("verifyIpnSignature", () => {
  const payload = {
    payment_id: "123",
    payment_status: "finished",
    pay_amount: 0.5,
    actually_paid: 0.5,
  };

  it("accepts a correctly signed payload", () => {
    const raw = JSON.stringify(payload);
    expect(verifyIpnSignature(raw, sign(payload))).toBe(true);
  });

  it("accepts even when the body keys are NOT in sorted order", () => {
    // Body sent with reversed key order; signature is over the sorted form.
    const raw = JSON.stringify({
      payment_status: "finished",
      payment_id: "123",
      pay_amount: 0.5,
      actually_paid: 0.5,
    });
    expect(verifyIpnSignature(raw, sign(payload))).toBe(true);
  });

  it("rejects a tampered body", () => {
    const sig = sign(payload);
    const tampered = JSON.stringify({ ...payload, actually_paid: 999 });
    expect(verifyIpnSignature(tampered, sig)).toBe(false);
  });

  it("rejects a wrong-length signature without throwing", () => {
    expect(verifyIpnSignature(JSON.stringify(payload), "deadbeef")).toBe(false);
  });

  it("rejects empty signature or body", () => {
    expect(verifyIpnSignature(JSON.stringify(payload), "")).toBe(false);
    expect(verifyIpnSignature("", sign(payload))).toBe(false);
  });
});
