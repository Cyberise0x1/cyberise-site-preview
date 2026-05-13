import prisma from "../_lib/db.js";
import { getCache, setCache } from "../_lib/redis.js";
import { success, error, handleOptions } from "../_lib/auth.js";

const LINODE_API = process.env.LINODE_API_URL;
const LINODE_TOKEN = process.env.LINODE_API_TOKEN;

async function linodeFetch(endpoint) {
  const res = await fetch(`${LINODE_API}${endpoint}`, {
    headers: { Authorization: `Bearer ${LINODE_TOKEN}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Linode API ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const cached = await getCache("market:data");
    if (cached) return success(res, cached);

    const settings = await prisma.marketSettings.findMany();
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]));

    const [plansRes, regionsRes, imagesRes] = await Promise.all([
      linodeFetch("/linode/types"),
      linodeFetch("/regions"),
      linodeFetch("/images?type=manual"),
    ]);

    const plans = plansRes.data.filter(p => p.class === "standard" || p.class === "nanode");
    const regions = regionsRes.data.filter(r => r.status === "ok" && r.capabilities.includes("Linodes"));
    const images = imagesRes.data.filter(img =>
      (img.label.toLowerCase().includes("windows") || (img.description || "").toLowerCase().includes("windows")) &&
      !img.deprecated
    );

    const enabledRegions = map.enabled_regions ?? regions.map(r => r.id);
    const enabledPlans = map.enabled_plans ?? plans.map(p => p.id);
    const markup = map.markup_percentage ?? 20;

    const filteredRegions = regions.filter(r => enabledRegions.includes(r.id));
    const filteredPlans = plans.filter(p => enabledPlans.includes(p.id)).map(plan => ({
      id: plan.id,
      label: plan.label,
      disk: plan.disk,
      ram: plan.ram,
      vcpus: plan.vcpus,
      price: {
        hourly: Number((plan.price.hourly * (1 + markup / 100)).toFixed(4)),
        monthly: Number((plan.price.monthly * (1 + markup / 100)).toFixed(2)),
      },
    }));

    const data = {
      plans: filteredPlans,
      regions: filteredRegions,
      images: images.length > 0 ? images.map(i => ({ id: i.id, label: i.label })) : [{ id: "linode/windows10", label: "Windows 10" }],
    };

    await setCache("market:data", data, 300);
    success(res, data);
  } catch (err) {
    console.error("market-plans:", err);
    error(res, "Failed to fetch market data");
  }
}
