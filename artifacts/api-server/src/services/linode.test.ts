import { describe, it, expect, vi } from "vitest";

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

import { getLinuxImages } from "./linode";

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
