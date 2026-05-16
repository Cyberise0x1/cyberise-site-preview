/**
 * rdp.monster integration — INTERNAL ONLY
 * Never expose provider name, brand, or API details to the frontend.
 * All plans/regions are returned under the "pro" tier label only.
 */

import { logger } from "../lib/logger";

const RDP_MONSTER_BASE = process.env.RDP_MONSTER_API_URL || "https://api.rdp.monster/v1";
const API_KEY = process.env.RDP_MONSTER_API_KEY;

function isConfigured(): boolean {
  return Boolean(API_KEY);
}

async function rdpFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${RDP_MONSTER_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text();
      logger.error({ endpoint, status: response.status, error }, "Pro provider API error");
      throw new Error(`Provider API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
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

export interface NormalizedProRegion {
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

/**
 * Safe label: strips any provider branding from plan/region names.
 * All buyer-facing labels must pass through this before returning to the frontend.
 */
function sanitizeLabel(raw: string): string {
  return raw
    .replace(/\brdp\.monster\b/gi, "")
    .replace(/\brdpmonster\b/gi, "")
    .replace(/\brdpm\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Fetches available Pro plans from the provider.
 * Returns [] gracefully if not configured or on error.
 *
 * API shape: GET /plans → { data: [{ id, name, cpu, memory_mb, disk_gb, price_monthly, price_hourly }] }
 * Set RDP_MONSTER_API_KEY and optionally RDP_MONSTER_API_URL to activate.
 */
export async function getProPlans(): Promise<NormalizedProPlan[]> {
  if (!isConfigured()) {
    logger.debug("Pro provider not configured — skipping pro plans");
    return [];
  }

  try {
    const response = await rdpFetch<{
      data: Array<{
        id: string;
        name: string;
        cpu: number;
        memory_mb: number;
        disk_gb: number;
        price_monthly: number;
        price_hourly: number;
      }>;
    }>("/plans");

    return response.data.map((plan) => ({
      id: `pro-${plan.id}`,
      label: sanitizeLabel(plan.name),
      disk: plan.disk_gb * 1024,
      ram: plan.memory_mb,
      vcpus: plan.cpu,
      price: {
        hourly: plan.price_hourly,
        monthly: plan.price_monthly,
      },
      tier: "pro" as const,
    }));
  } catch (error) {
    logger.error({ error }, "Failed to fetch pro plans — returning empty list");
    return [];
  }
}

/**
 * Fetches available Pro regions/locations.
 * Returns [] gracefully if not configured or on error.
 *
 * API shape: GET /regions → { data: [{ id, name, country_code }] }
 */
export async function getProRegions(): Promise<NormalizedProRegion[]> {
  if (!isConfigured()) return [];

  try {
    const response = await rdpFetch<{
      data: Array<{ id: string; name: string; country_code: string }>;
    }>("/regions");

    return response.data.map((region) => ({
      id: `pro-${region.id}`,
      label: sanitizeLabel(region.name),
      country: region.country_code.toLowerCase(),
      tier: "pro" as const,
    }));
  } catch (error) {
    logger.error({ error }, "Failed to fetch pro regions — returning empty list");
    return [];
  }
}

/**
 * Creates a Pro server instance.
 *
 * API shape: POST /instances → { instance_id, ip_address, username, password }
 * Request body: { plan_id, region_id, label }
 */
export async function createProInstance(params: {
  planId: string;
  regionId: string;
  label: string;
}): Promise<ProOrderResult> {
  if (!isConfigured()) {
    throw new Error("Pro provider not configured");
  }

  const rawPlanId = params.planId.replace("pro-", "");
  const rawRegionId = params.regionId.replace("pro-", "");

  const response = await rdpFetch<{
    instance_id: string;
    ip_address: string;
    username: string;
    password: string;
  }>("/instances", {
    method: "POST",
    body: JSON.stringify({
      plan_id: rawPlanId,
      region_id: rawRegionId,
      label: params.label,
    }),
  });

  return {
    instanceId: response.instance_id,
    ip: response.ip_address,
    username: response.username,
    password: response.password,
  };
}

/**
 * Terminates a Pro server instance.
 */
export async function deleteProInstance(instanceId: string): Promise<void> {
  if (!isConfigured()) return;

  try {
    await rdpFetch(`/instances/${instanceId}`, { method: "DELETE" });
  } catch (error) {
    logger.error({ error, instanceId }, "Failed to delete pro instance");
    throw error;
  }
}
