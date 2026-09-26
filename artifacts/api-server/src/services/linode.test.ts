import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

vi.mock("../utils/env", () => ({
  env: {
    LINODE_API_URL: "https://api.linode.com/v4",
    LINODE_API_TOKEN: "test-token",
  },
}));
vi.mock("../utils/circuitBreaker", () => ({
  getBreaker: () => ({ call: (fn: () => unknown) => fn() }),
}));
vi.mock("../lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import {
  getLinuxImages,
  isLinuxImageId,
  validateLinuxImagesAgainstLinode,
} from "./linode";
import { logger } from "../lib/logger";

const VALID_IMAGE_ID_RE = /^linode\//;

const EXPECTED_IMAGE_IDS = [
  "linode/debian12",
  "linode/debian11",
  "linode/ubuntu24.04",
  "linode/ubuntu22.04",
  "linode/almalinux9",
  "linode/rocky9",
];

describe("getLinuxImages()", () => {
  it("returns a non-empty array", () => {
    const images = getLinuxImages();
    expect(images.length).toBeGreaterThan(0);
  });

  it("every image ID starts with 'linode/'", () => {
    const images = getLinuxImages();
    for (const img of images) {
      expect(img.id).toMatch(VALID_IMAGE_ID_RE);
    }
  });

  it("includes all expected distro image IDs", () => {
    const ids = getLinuxImages().map((img) => img.id);
    for (const expectedId of EXPECTED_IMAGE_IDS) {
      expect(ids).toContain(expectedId);
    }
  });

  it("every image has a non-empty label and status 'available'", () => {
    const images = getLinuxImages();
    for (const img of images) {
      expect(img.label.length).toBeGreaterThan(0);
      expect(img.status).toBe("available");
    }
  });

  it("no image is marked deprecated", () => {
    const images = getLinuxImages();
    for (const img of images) {
      expect(img.deprecated).toBe(false);
    }
  });

  it("returns a fresh array each call (not a shared reference)", () => {
    const a = getLinuxImages();
    const b = getLinuxImages();
    expect(a).not.toBe(b);
  });
});

describe("isLinuxImageId()", () => {
  it("recognizes configured Linux image IDs", () => {
    expect(isLinuxImageId("linode/ubuntu22.04")).toBe(true);
  });

  it("does not treat an unknown image ID as Linux", () => {
    expect(isLinuxImageId("private/12345")).toBe(false);
  });
});

describe("validateLinuxImagesAgainstLinode()", () => {
  const fetchMock = vi.fn();

  function imageListResponse(data: unknown[], pages: number): Response {
    return {
      ok: true,
      json: async () => ({ data, pages }),
    } as unknown as Response;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    vi.stubEnv("LINODE_API_TOKEN", "test-token");
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("skips the live check when the Linode API token is missing", async () => {
    vi.stubEnv("LINODE_API_TOKEN", "");

    const result = await validateLinuxImagesAgainstLinode();

    expect(result.status).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("checks every page and accepts available configured images", async () => {
    const configuredImages = getLinuxImages();
    fetchMock
      .mockResolvedValueOnce(
        imageListResponse(configuredImages.slice(0, 3), 2),
      )
      .mockResolvedValueOnce(
        imageListResponse(configuredImages.slice(3), 2),
      );

    const result = await validateLinuxImagesAgainstLinode();

    expect(result.status).toBe("valid");
    expect(result.checkedIds).toBe(configuredImages.length);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("page=1");
    expect(fetchMock.mock.calls[1][0]).toContain("page=2");
  });

  it("warns and reports missing, deprecated, and unavailable images", async () => {
    const configuredImages = getLinuxImages();
    const liveImages = configuredImages.slice(1).map((image) => ({ ...image }));
    liveImages[0] = { ...liveImages[0], deprecated: true };
    liveImages[1] = { ...liveImages[1], status: "unavailable" };
    fetchMock.mockResolvedValueOnce(imageListResponse(liveImages, 1));

    const result = await validateLinuxImagesAgainstLinode();

    expect(result.status).toBe("mismatch");
    expect(result.missingIds).toContain(configuredImages[0].id);
    expect(result.unavailableIds).toEqual([
      liveImages[0].id,
      liveImages[1].id,
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        missingIds: [configuredImages[0].id],
        unavailableIds: [liveImages[0].id, liveImages[1].id],
      }),
      expect.stringContaining("missing, deprecated, or unavailable"),
    );
  });

  it("throws on mismatches when strict validation is enabled", async () => {
    fetchMock.mockResolvedValueOnce(imageListResponse([], 1));

    await expect(
      validateLinuxImagesAgainstLinode({ strict: true }),
    ).rejects.toThrow("Linode Linux image validation failed");
  });

  it("warns on provider errors by default and throws in strict mode", async () => {
    fetchMock.mockRejectedValue(new Error("Linode unavailable"));

    const result = await validateLinuxImagesAgainstLinode();

    expect(result.status).toBe("error");
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      "Unable to validate Linux image IDs against Linode",
    );
    await expect(
      validateLinuxImagesAgainstLinode({ strict: true }),
    ).rejects.toThrow("Linode unavailable");
  });
});
