import { env } from "../utils/env";
import { logger } from "../lib/logger";
import { getBreaker } from "../utils/circuitBreaker";

const getApiBase = () => env.LINODE_API_URL;
const getAuthHeader = () => `Bearer ${env.LINODE_API_TOKEN}`;

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

async function linodeFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${getApiBase()}${endpoint}`;

  return linodeBreaker.call(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const error = await response.text();
        logger.error(
          { endpoint, status: response.status, error },
          "Linode API error",
        );
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
  return response.data.filter(
    (plan) => plan.class === "standard" || plan.class === "nanode",
  );
}

export async function getSharedCPUPlans(): Promise<LinodePlan[]> {
  const plans = await getPlans();
  return plans.filter(
    (plan) =>
      (plan.class === "nanode" || plan.class === "standard") &&
      plan.ram >= 1024 &&
      plan.ram <= 32768,
  );
}

export async function getRegions(): Promise<LinodeRegion[]> {
  const response = await linodeFetch<{ data: LinodeRegion[] }>("/regions");
  return response.data.filter(
    (region) =>
      region.status === "ok" && region.capabilities.includes("Linodes"),
  );
}

export async function getWindowsImages(): Promise<LinodeImage[]> {
  const response = await linodeFetch<{ data: LinodeImage[] }>(
    "/images?type=manual",
  );
  return response.data.filter(
    (img) =>
      (img.label.toLowerCase().includes("windows") ||
        img.description?.toLowerCase().includes("windows")) &&
      !img.deprecated,
  );
}

export function getLinuxImages(): LinodeImage[] {
  return [
    {
      id: "linode/debian12",
      label: "Debian 12",
      description: "Debian 12 (Bookworm)",
      size: 1536,
      status: "available",
      type: "manual",
      vendor: "Debian",
      deprecated: false,
    },
    {
      id: "linode/debian11",
      label: "Debian 11",
      description: "Debian 11 (Bullseye)",
      size: 1536,
      status: "available",
      type: "manual",
      vendor: "Debian",
      deprecated: false,
    },
    {
      id: "linode/ubuntu24.04",
      label: "Ubuntu 24.04 LTS",
      description: "Ubuntu 24.04 LTS (Noble Numbat)",
      size: 1536,
      status: "available",
      type: "manual",
      vendor: "Ubuntu",
      deprecated: false,
    },
    {
      id: "linode/ubuntu22.04",
      label: "Ubuntu 22.04 LTS",
      description: "Ubuntu 22.04 LTS (Jammy Jellyfish)",
      size: 1536,
      status: "available",
      type: "manual",
      vendor: "Ubuntu",
      deprecated: false,
    },
    {
      id: "linode/almalinux9",
      label: "AlmaLinux 9",
      description: "AlmaLinux 9",
      size: 1536,
      status: "available",
      type: "manual",
      vendor: "AlmaLinux",
      deprecated: false,
    },
    {
      id: "linode/rocky9",
      label: "Rocky Linux 9",
      description: "Rocky Linux 9",
      size: 1536,
      status: "available",
      type: "manual",
      vendor: "Rocky Linux",
      deprecated: false,
    },
  ];
}

export function isLinuxImageId(imageId: string): boolean {
  return getLinuxImages().some((image) => image.id === imageId);
}

interface LinodeImageListResponse {
  data: LinodeImage[];
  pages: number;
}

export interface LinuxImageValidationResult {
  status: "skipped" | "valid" | "mismatch" | "error";
  checkedIds: number;
  missingIds: string[];
  unavailableIds: string[];
}

async function getAllManualImages(): Promise<LinodeImage[]> {
  const pageSize = 500;
  const firstPageQuery = new URLSearchParams({
    type: "manual",
    page_size: String(pageSize),
    page: "1",
  });
  const firstPage = await linodeFetch<LinodeImageListResponse>(
    `/images?${firstPageQuery.toString()}`,
  );

  if (
    !Array.isArray(firstPage.data) ||
    !Number.isInteger(firstPage.pages) ||
    firstPage.pages < 1
  ) {
    throw new Error("Linode returned an invalid image-list response");
  }

  const images = [...firstPage.data];
  for (let page = 2; page <= firstPage.pages; page += 1) {
    const query = new URLSearchParams({
      type: "manual",
      page_size: String(pageSize),
      page: String(page),
    });
    const response = await linodeFetch<LinodeImageListResponse>(
      `/images?${query.toString()}`,
    );

    if (!Array.isArray(response.data)) {
      throw new Error(`Linode returned invalid image data for page ${page}`);
    }

    images.push(...response.data);
  }

  return images;
}

export async function validateLinuxImagesAgainstLinode(options?: {
  strict?: boolean;
}): Promise<LinuxImageValidationResult> {
  const strict = options?.strict ?? false;
  const configuredImages = getLinuxImages();
  const emptyResult = {
    checkedIds: configuredImages.length,
    missingIds: [],
    unavailableIds: [],
  };

  if (!process.env["LINODE_API_TOKEN"]?.trim()) {
    logger.info(
      "Skipping Linux image validation because LINODE_API_TOKEN is not configured",
    );
    return { ...emptyResult, status: "skipped" };
  }

  let liveImages: LinodeImage[];
  try {
    liveImages = await getAllManualImages();
  } catch (err) {
    logger.warn({ err }, "Unable to validate Linux image IDs against Linode");
    if (strict) {
      throw err;
    }
    return { ...emptyResult, status: "error" };
  }

  const liveImagesById = new Map(liveImages.map((image) => [image.id, image]));
  const missingIds = configuredImages
    .filter((image) => !liveImagesById.has(image.id))
    .map((image) => image.id);
  const unavailableIds = configuredImages
    .filter((image) => {
      const liveImage = liveImagesById.get(image.id);
      return (
        liveImage !== undefined &&
        (liveImage.deprecated || liveImage.status !== "available")
      );
    })
    .map((image) => image.id);

  if (missingIds.length > 0 || unavailableIds.length > 0) {
    logger.warn(
      { missingIds, unavailableIds },
      "Configured Linux image IDs are missing, deprecated, or unavailable in Linode",
    );
    if (strict) {
      throw new Error(
        `Linode Linux image validation failed: ${[
          ...missingIds,
          ...unavailableIds,
        ].join(", ")}`,
      );
    }
    return {
      ...emptyResult,
      status: "mismatch",
      missingIds,
      unavailableIds,
    };
  }

  logger.info(
    { checkedIds: configuredImages.length },
    "Configured Linux image IDs validated against Linode",
  );
  return { ...emptyResult, status: "valid" };
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

export {
  type LinodePlan,
  type LinodeRegion,
  type LinodeImage,
  type LinodeInstance,
};
