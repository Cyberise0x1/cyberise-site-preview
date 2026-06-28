import { describe, it, expect, vi, beforeEach } from "vitest";

const getPlans = vi.fn();
const createInstance = vi.fn();
const getProPlans = vi.fn();
const createProInstance = vi.fn();

vi.mock("./linode", () => ({
  getPlans: (...a: unknown[]) => getPlans(...a),
  createInstance: (...a: unknown[]) => createInstance(...a),
}));
vi.mock("./rdpmonster", () => ({
  getProPlans: (...a: unknown[]) => getProPlans(...a),
  createProInstance: (...a: unknown[]) => createProInstance(...a),
}));
vi.mock("../utils/encryption", () => ({
  generatePassword: () => "pw-fixed-1234567",
}));
vi.mock("../lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { calculatePrice, provisionInstance } from "./provisioning";

const basicPlan = {
  id: "g6-standard-1",
  price: { hourly: 0.015, monthly: 10 },
};
const proPlan = { id: "pro-7", price: { hourly: 0.05, monthly: 36.5 } };

beforeEach(() => {
  vi.clearAllMocks();
  getPlans.mockResolvedValue([basicPlan]);
  getProPlans.mockResolvedValue([proPlan]);
});

describe("calculatePrice", () => {
  it("applies markup and prorates by duration without provisioning", async () => {
    const { totalAmount } = await calculatePrice({
      plan: "g6-standard-1",
      tier: "basic",
      durationDays: 30,
      markupPercent: 20,
    });
    // 10 * 1.20 * (30/30)
    expect(totalAmount).toBe(12);
    expect(createInstance).not.toHaveBeenCalled();
    expect(createProInstance).not.toHaveBeenCalled();
  });

  it("prorates partial durations", async () => {
    const { totalAmount } = await calculatePrice({
      plan: "g6-standard-1",
      tier: "basic",
      durationDays: 15,
      markupPercent: 0,
    });
    // 10 * 1.0 * (15/30)
    expect(totalAmount).toBe(5);
  });

  it("prices pro plans from the pro catalog, no server created", async () => {
    const { totalAmount } = await calculatePrice({
      plan: "pro-7",
      tier: "pro",
      durationDays: 30,
      markupPercent: 0,
    });
    expect(totalAmount).toBe(36.5);
    expect(createProInstance).not.toHaveBeenCalled();
  });

  it("throws a 400 on an unknown plan and never provisions", async () => {
    await expect(
      calculatePrice({
        plan: "does-not-exist",
        tier: "basic",
        durationDays: 30,
        markupPercent: 20,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(createInstance).not.toHaveBeenCalled();
  });
});

describe("provisionInstance", () => {
  it("creates a basic instance and returns the matching price", async () => {
    createInstance.mockResolvedValue({ id: 123, ipv4: ["1.2.3.4"] });
    const result = await provisionInstance({
      plan: "g6-standard-1",
      region: "us-east",
      image: "linode/ubuntu",
      tier: "basic",
      userId: "user_abcdefgh",
      durationDays: 30,
      markupPercent: 20,
    });
    expect(createInstance).toHaveBeenCalledTimes(1);
    expect(result.ip).toBe("1.2.3.4");
    expect(result.instanceId).toBe(123);
    expect(result.totalAmount).toBe(12);
  });

  it("forwards the selected image ID verbatim to createInstance", async () => {
    createInstance.mockResolvedValue({ id: 456, ipv4: ["5.6.7.8"] });
    await provisionInstance({
      plan: "g6-standard-1",
      region: "us-east",
      image: "linode/debian12",
      tier: "basic",
      userId: "user_abcdefgh",
      durationDays: 30,
      markupPercent: 0,
    });
    expect(createInstance).toHaveBeenCalledWith(
      expect.objectContaining({ image: "linode/debian12" }),
    );
  });

  it("forwards each supported distro image ID without mutation", async () => {
    const imageIds = [
      "linode/debian12",
      "linode/debian11",
      "linode/ubuntu24.04",
      "linode/ubuntu22.04",
      "linode/almalinux9",
      "linode/rocky9",
    ];

    for (const imageId of imageIds) {
      vi.clearAllMocks();
      getPlans.mockResolvedValue([basicPlan]);
      createInstance.mockResolvedValue({ id: 1, ipv4: ["1.1.1.1"] });

      await provisionInstance({
        plan: "g6-standard-1",
        region: "us-east",
        image: imageId,
        tier: "basic",
        userId: "user_abcdefgh",
        durationDays: 7,
        markupPercent: 0,
      });

      expect(createInstance).toHaveBeenCalledWith(
        expect.objectContaining({ image: imageId }),
      );
    }
  });

  it("returns 'root' as the username for a basic Linux instance", async () => {
    createInstance.mockResolvedValue({ id: 789, ipv4: ["9.9.9.9"] });
    const result = await provisionInstance({
      plan: "g6-standard-1",
      region: "us-east",
      image: "linode/ubuntu22.04",
      tier: "basic",
      userId: "user_abcdefgh",
      durationDays: 30,
      markupPercent: 0,
    });
    expect(result.username).toBe("root");
  });

  it("surfaces a 503 when createInstance rejects and does not swallow the error", async () => {
    createInstance.mockRejectedValue(new Error("Linode API error: 422 - bad image"));
    await expect(
      provisionInstance({
        plan: "g6-standard-1",
        region: "us-east",
        image: "linode/nonexistent",
        tier: "basic",
        userId: "user_abcdefgh",
        durationDays: 30,
        markupPercent: 0,
      }),
    ).rejects.toMatchObject({ statusCode: 503 });
  });
});
