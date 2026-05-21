/**
 * rdp.monster reseller API integration — INTERNAL ONLY
 * Never expose provider name, brand, or API details to the frontend.
 * All plans are returned under the "pro" tier label only.
 *
 * Auth: HMAC-SHA256 token (rotated hourly) + email header
 * Base: https://manager.rdp.monster/api.php
 */

import crypto from "node:crypto";
import { logger } from "../lib/logger";

const RDP_MONSTER_BASE =
  process.env.RDP_MONSTER_API_URL || "https://manager.rdp.monster/api.php";
const API_KEY = process.env.RDP_MONSTER_API_KEY;
const EMAIL = process.env.RDP_MONSTER_EMAIL;

function isConfigured(): boolean {
  return Boolean(API_KEY && EMAIL);
}

function buildToken(): string {
  const now = new Date();
  const iso = now.toISOString();
  const datePart = iso
    .slice(2, 13)
    .replace(/[-T:]/g, " ")
    .replace(" ", "-")
    .replace(" ", "-");

  const hmacKey = `${EMAIL}:${datePart}`;
  const hex = crypto
    .createHmac("sha256", hmacKey)
    .update(API_KEY!)
    .digest("hex");
  return Buffer.from(hex).toString("base64");
}

async function rdpFetch<T>(
  method: string,
  endpoint: string,
  body?: URLSearchParams,
): Promise<T> {
  const sep = endpoint.includes("?") ? "&" : "?";
  const url = `${RDP_MONSTER_BASE}${endpoint}${sep}_=${Date.now()}`;

  const headers: Record<string, string> = {
    username: EMAIL!,
    token: buildToken(),
    Accept: "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
  };

  if (method !== "GET") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? new URLSearchParams(body).toString() : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text();
      logger.error(
        { endpoint, status: response.status, error },
        "Pro provider API error",
      );
      throw new Error(`Provider API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

interface ProProduct {
  id: number;
  name: string;
  integration: string;
  billingCycles?: string[];
  pricing?: Array<{
    cycle: string;
    currency: string;
    price: number;
    setupfee: number;
  }>;
  configOptions?: Record<
    string,
    {
      optiontype: string;
      qtyminimum?: number;
      qtymaximum?: number;
      configurableSubOptions?: Array<{
        optionname: string;
        hidden?: number;
      }>;
    }
  >;
}

interface ProProductsResponse {
  resut?: string;
  result?: string;
  data?: ProProduct[];
}

export interface NormalizedProPlan {
  id: string;
  label: string;
  disk: number;
  ram: number;
  vcpus: number;
  price: {
    hourly: number;
    monthly: number;
  };
  tier: "pro";
}

interface NormalizedProRegion {
  id: string;
  label: string;
  country: string;
  tier: "pro";
}

export interface ProOrderResult {
  instanceId: string;
  ip: string;
  username: string;
  password: string;
}

interface ProOrderResponse {
  result?: string;
  resut?: string;
  error?: string;
  service?: {
    id: number;
    domain?: string;
    dedicatedip?: string;
    username?: string;
  };
  orderid?: number;
  invoiceid?: number;
}

function sanitizeLabel(raw: string): string {
  return raw
    .replace(/\brdp\.monster\b/gi, "")
    .replace(/\brdpmonster\b/gi, "")
    .replace(/\brdpm\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseDiskGB(configOptions: ProProduct["configOptions"]): number {
  if (!configOptions) return 40;

  for (const [rawKey, def] of Object.entries(configOptions)) {
    if (rawKey.toLowerCase().includes("disk space")) {
      const subs = def.configurableSubOptions ?? [];
      const first = subs.find((s) => !s.hidden);
      if (first) {
        const value = first.optionname.split("|")[0].trim();
        const gb = parseInt(value, 10);
        if (!isNaN(gb)) return gb;
      }
    }
  }

  return 40;
}

function parseVcpus(
  name: string,
  configOptions: ProProduct["configOptions"],
): number {
  const vcpuOpt = Object.entries(configOptions ?? {}).find(([k]) =>
    k.toLowerCase().includes("cpu"),
  );
  if (vcpuOpt) {
    const def = vcpuOpt[1];
    const min = def.qtyminimum ?? def.configurableSubOptions?.length ?? 1;
    if (min > 0) return min;
  }

  return 2;
}

function parseRamMB(
  name: string,
  configOptions: ProProduct["configOptions"],
): number {
  const ramOpt = Object.entries(configOptions ?? {}).find(
    ([k]) =>
      k.toLowerCase().includes("ram") || k.toLowerCase().includes("memory"),
  );
  if (ramOpt) {
    const subs = ramOpt[1].configurableSubOptions ?? [];
    const first = subs.find((s) => !s.hidden);
    if (first) {
      const raw = first.optionname.split("|")[0].trim().toLowerCase();
      const num = parseInt(raw, 10);
      if (!isNaN(num)) {
        return raw.includes("gb") ? num * 1024 : num;
      }
    }
  }

  return 1024;
}

export async function getProPlans(): Promise<NormalizedProPlan[]> {
  if (!isConfigured()) {
    logger.debug("Pro provider not configured — skipping pro plans");
    return [];
  }

  try {
    const response = await rdpFetch<ProProductsResponse>("GET", "/products");

    const products = response.data ?? [];
    const active = products.filter(
      (p) =>
        p.integration === "ProxmoxVPS" || p.integration?.includes("Proxmox"),
    );

    return active.map((product) => {
      const monthlyPrice =
        product.pricing?.find((p) => p.cycle === "monthly")?.price ?? 0;

      return {
        id: `pro-${product.id}`,
        label: sanitizeLabel(product.name),
        disk: parseDiskGB(product.configOptions) * 1024,
        ram: parseRamMB(product.name, product.configOptions),
        vcpus: parseVcpus(product.name, product.configOptions),
        price: {
          hourly: Number((monthlyPrice / 730).toFixed(4)),
          monthly: monthlyPrice,
        },
        tier: "pro" as const,
      };
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch pro plans");
    return [];
  }
}

export async function getProRegions(): Promise<NormalizedProRegion[]> {
  if (!isConfigured()) return [];

  return [
    {
      id: "pro-eu",
      label: "Europe",
      country: "nl",
      tier: "pro" as const,
    },
  ];
}

export async function createProInstance(params: {
  planId: string;
  regionId: string;
  label: string;
  password?: string;
}): Promise<ProOrderResult> {
  if (!isConfigured()) {
    throw new Error("Pro provider not configured");
  }

  const rawPlanId = params.planId.replace("pro-", "");
  const password = params.password ?? generateInstancePassword();

  const body = new URLSearchParams();
  body.append("cycle", "monthly");
  body.append("username", "Administrator");
  body.append("password", password);
  body.append(
    "hostname",
    params.label.replace(/[^A-Za-z0-9-]/g, "-").slice(0, 32),
  );
  body.append("nsprefix[0]", "ns1.rdp.monster");
  body.append("nsprefix[1]", "ns2.rdp.monster");

  const products = await rdpFetch<ProProductsResponse>("GET", "/products");
  const product = (products.data ?? []).find((p) => String(p.id) === rawPlanId);

  if (product?.configOptions) {
    const diskKey = Object.keys(product.configOptions).find((k) =>
      k.toLowerCase().startsWith("disk space"),
    );
    if (diskKey) {
      const subs = product.configOptions[diskKey].configurableSubOptions ?? [];
      const first = subs.find((s) => !s.hidden);
      if (first) {
        const diskValue = first.optionname.split("|")[0].trim();
        body.append(
          `configurations[${diskKey.split("|")[0].trim()}]`,
          diskValue,
        );
      }
    }

    const templateKey = Object.keys(product.configOptions).find((k) =>
      k.toLowerCase().startsWith("vm template"),
    );
    if (templateKey) {
      const subs =
        product.configOptions[templateKey].configurableSubOptions ?? [];
      const windows = subs.find(
        (s) => s.optionname.toLowerCase().includes("windows") && !s.hidden,
      );
      const fallback = subs.find((s) => !s.hidden);
      const template = windows ?? fallback;
      if (template) {
        body.append(
          `configurations[${templateKey.split("|")[0].trim()}]`,
          template.optionname.split("|")[0].trim(),
        );
      }
    }
  }

  const response = await rdpFetch<ProOrderResponse>(
    "POST",
    `/order/products/${rawPlanId}`,
    body,
  );

  const service = response.service;
  if (!service?.id) {
    const errorMsg = response.error ?? "order_failed";
    logger.error({ rawPlanId, response }, "Pro order failed");
    throw new Error(errorMsg);
  }

  return {
    instanceId: String(service.id),
    ip: service.dedicatedip ?? "",
    username: service.username ?? "Administrator",
    password,
  };
}

export async function deleteProInstance(instanceId: string): Promise<void> {
  if (!isConfigured()) return;

  try {
    const service = await rdpFetch<{
      id?: number;
      status?: string;
      error?: string;
    }>("GET", `/services/${instanceId}`);

    if (
      service?.status === "Terminated" ||
      service?.error?.includes("Terminated")
    ) {
      logger.info({ instanceId }, "Pro instance already terminated");
      return;
    }

    logger.warn(
      { instanceId },
      "Pro provider does not support instance deletion via API — service must be cancelled in the rdp.monster dashboard",
    );
  } catch (error) {
    logger.error({ error, instanceId }, "Failed to check pro instance status");
    throw error;
  }
}

function generateInstancePassword(): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const bytes = crypto.randomBytes(16);
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += charset[bytes[i] % charset.length];
  }
  password += "1";
  return password;
}
