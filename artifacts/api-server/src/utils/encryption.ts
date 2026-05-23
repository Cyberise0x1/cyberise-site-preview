import CryptoJS from "crypto-js";
import crypto from "node:crypto";
import { env } from "./env";

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, env.ENCRYPTION_SECRET).toString();
}

export function decrypt(encryptedText: string): string {
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
