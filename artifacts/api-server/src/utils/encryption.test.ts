import { describe, it, expect, vi } from "vitest";
import CryptoJS from "crypto-js";

const { SECRET } = vi.hoisted(() => ({
  SECRET: "test-encryption-secret-at-least-32-chars-long",
}));

vi.mock("./env", () => ({ env: { ENCRYPTION_SECRET: SECRET } }));

import { encrypt, decrypt, generatePassword } from "./encryption";

describe("encrypt/decrypt (AES-256-GCM)", () => {
  it("round-trips a value", () => {
    const secret = "hunter2-Pa$$w0rd";
    const enc = encrypt(secret);
    expect(enc.startsWith("gcm:")).toBe(true);
    expect(decrypt(enc)).toBe(secret);
  });

  it("produces a different ciphertext each call (random IV)", () => {
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("rejects a tampered ciphertext (auth tag)", () => {
    const enc = encrypt("sensitive");
    // Flip the last char of the base64 ciphertext segment.
    const last = enc.endsWith("A") ? "B" : "A";
    const tampered = enc.slice(0, -1) + last;
    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws on a malformed gcm value", () => {
    expect(() => decrypt("gcm:onlyonesegment")).toThrow();
  });

  it("still decrypts legacy CryptoJS AES-CBC values", () => {
    const secret = "legacy-stored-password";
    const legacy = CryptoJS.AES.encrypt(secret, SECRET).toString();
    expect(legacy.startsWith("gcm:")).toBe(false);
    expect(decrypt(legacy)).toBe(secret);
  });
});

describe("generatePassword", () => {
  it("returns a string of the requested length from the charset", () => {
    const pw = generatePassword(24);
    expect(pw).toHaveLength(24);
    expect(/^[A-Za-z0-9!@#$%^&*]+$/.test(pw)).toBe(true);
  });
});
