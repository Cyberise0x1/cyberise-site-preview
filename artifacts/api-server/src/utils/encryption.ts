import CryptoJS from "crypto-js";
import crypto from "node:crypto";
import { env } from "./env";

// Stored credentials (RDP/root passwords) are encrypted with AES-256-GCM, which
// is authenticated (tamper-evident) — unlike the legacy CryptoJS AES-CBC format
// (OpenSSL MD5 key derivation, no MAC). New values carry the GCM_PREFIX so
// decrypt() can route them; legacy values without the prefix still decrypt via
// CryptoJS for backward compatibility with already-stored rows.
const GCM_PREFIX = "gcm:";
// Fixed application salt — ENCRYPTION_SECRET (min 32 chars) is the secret input.
const KEY_SALT = "cyberise:rdp-cred:v2";

let cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (!cachedKey) {
    cachedKey = crypto.scryptSync(env.ENCRYPTION_SECRET, KEY_SALT, 32);
  }
  return cachedKey;
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(text, "utf-8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${GCM_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decrypt(encryptedText: string): string {
  if (encryptedText.startsWith(GCM_PREFIX)) {
    const [ivB64, tagB64, ctB64] = encryptedText
      .slice(GCM_PREFIX.length)
      .split(":");
    if (!ivB64 || !tagB64 || !ctB64) {
      throw new Error("Malformed encrypted value");
    }
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getKey(),
      Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ctB64, "base64")),
      decipher.final(),
    ]);
    return plaintext.toString("utf-8");
  }

  // Legacy CryptoJS AES-CBC values (pre-GCM). Retained so existing stored
  // credentials remain decryptable; new writes always use GCM above.
  const bytes = CryptoJS.AES.decrypt(encryptedText, env.ENCRYPTION_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function generatePassword(length = 16): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
}
