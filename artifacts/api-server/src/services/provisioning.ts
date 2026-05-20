import { getPlans, createInstance } from "./linode";
import { getProPlans, createProInstance } from "./rdpmonster";
import { generatePassword } from "../utils/encryption";
import { logger } from "../lib/logger";

export interface ProvisionParams {
  plan: string;
  region: string;
  image: string;
  tier: "basic" | "pro";
  userId: string;
  durationDays: number;
  markupPercent: number;
}

export interface ProvisionResult {
  ip: string;
  username: string;
  password: string;
  instanceId: string | number;
  totalAmount: number;
  expiresAt: Date;
}

export async function provisionInstance(
  params: ProvisionParams,
): Promise<ProvisionResult> {
  const { plan, region, image, tier, userId, durationDays, markupPercent } =
    params;

  if (tier === "pro") {
    const proPlans = await getProPlans();
    const selectedPlan = proPlans.find((p) => p.id === plan);
    if (!selectedPlan) {
      throw Object.assign(new Error("Invalid plan selected"), { statusCode: 400 });
    }

    const monthlyPrice =
      selectedPlan.price.monthly * (1 + markupPercent / 100);
    const totalAmount = Number(
      (monthlyPrice * (durationDays / 30)).toFixed(2),
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const label = `cyberise-pro-${userId.slice(0, 8)}-${Date.now()}`;
    const instance = await createProInstance({
      planId: plan,
      regionId: region,
      label,
    });

    return {
      ip: instance.ip,
      username: instance.username,
      password: instance.password,
      instanceId: instance.instanceId,
      totalAmount,
      expiresAt,
    };
  }

  const basicPlans = await getPlans();
  const selectedPlan = basicPlans.find((p) => p.id === plan);
  if (!selectedPlan) {
    throw Object.assign(new Error("Invalid plan selected"), { statusCode: 400 });
  }

  const monthlyPrice =
    selectedPlan.price.monthly * (1 + markupPercent / 100);
  const totalAmount = Number(
    (monthlyPrice * (durationDays / 30)).toFixed(2),
  );
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  const rdpPassword = generatePassword(16);
  const label = `cyberise-rdp-${userId.slice(0, 8)}-${Date.now()}`;

  let linodeInstance;
  try {
    linodeInstance = await createInstance({
      region,
      type: plan,
      image,
      label,
      root_pass: rdpPassword,
      tags: ["cyberise-rdp", userId.slice(0, 8)],
    });
  } catch (error) {
    logger.error({ error, plan, region }, "Instance creation failed");
    throw Object.assign(
      new Error(
        "Failed to provision instance. Please try a different region or plan.",
      ),
      { statusCode: 503 },
    );
  }

  return {
    ip: linodeInstance.ipv4[0],
    username: "Administrator",
    password: rdpPassword,
    instanceId: linodeInstance.id,
    totalAmount,
    expiresAt,
  };
}
