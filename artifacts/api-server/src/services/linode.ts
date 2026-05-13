import { env } from "../utils/env";
import { logger } from "../lib/logger";
import { getBreaker } from "../utils/circuitBreaker";

const LINODE_API_BASE = env.LINODE_API_URL;
const AUTH_HEADER = `Bearer ${env.LINODE_API_TOKEN}`;

interface LinodePlan {
  id: string;
  label: string;
  disk: number;
  ram: number;
  vcpus: number;
  gpus: number;
  network_out: number;
  transfer: number;
  price: {
    hourly: number;
    monthly: number;
  };
  class: string;
}

interface LinodeRegion {
  id: string;
  label: string;
  country: string;
  capabilities: string[];
  status: string;
  resolvers: {
    ipv4: string;
    ipv6: string;
  };
}

interface LinodeImage {
  id: string;
  label: string;
  description: string;
  size: number;
  status: string;
  type: string;
  vendor: string | null;
  deprecated: boolean;
}

interface LinodeInstance {
  id: number;
  label: string;
  status: string;
  region: string;
  type: string;
  ipv4: string[];
  ipv6: string | null;
  created: string;
  updated: string;
}

const linodeBreaker = getBreaker("linode-api", {
  failureThreshold: 3,
  cooldownMs: 30000,
  timeoutMs: 30000,
});

async function linodeFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${LINODE_API_BASE}${endpoint}`;

  return linodeBreaker.call(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: AUTH_HEADER,
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const error = await response.text();
        logger.error({ endpoint, status: response.status, error }, "Linode API error");
        throw new Error(`Linode API error: ${response.status} - ${error}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  });
}

export async function getPlans(): Promise<LinodePlan[]> {
  const response = await linodeFetch<{ data: LinodePlan[] }>("/linode/types");
  return response.data.filter(plan =>
    plan.class === "standard" || plan.class === "nanode"
  );
}

export async function getRegions(): Promise<LinodeRegion[]> {
  const response = await linodeFetch<{ data: LinodeRegion[] }>("/regions");
  return response.data.filter(region =>
    region.status === "ok" &&
    region.capabilities.includes("Linodes")
  );
}

export async function getWindowsImages(): Promise<LinodeImage[]> {
  const response = await linodeFetch<{ data: LinodeImage[] }>("/images?type=manual");
  return response.data.filter(img =>
    (img.label.toLowerCase().includes("windows") ||
     img.description?.toLowerCase().includes("windows")) &&
    !img.deprecated
  );
}

export async function createInstance(params: {
  region: string;
  type: string;
  image?: string;
  label: string;
  root_pass?: string;
  tags?: string[];
}): Promise<LinodeInstance> {
  const body = {
    region: params.region,
    type: params.type,
    label: params.label,
    image: params.image,
    root_pass: params.root_pass,
    tags: params.tags ?? ["cyberise-rdp"],
    booted: true,
  };

  return linodeFetch<LinodeInstance>("/linode/instances", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteInstance(instanceId: number): Promise<void> {
  await linodeFetch(`/linode/instances/${instanceId}`, {
    method: "DELETE",
  });
}

export { type LinodePlan, type LinodeRegion, type LinodeImage, type LinodeInstance };
