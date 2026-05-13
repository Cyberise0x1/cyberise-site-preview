import prisma from "../../_lib/db.js";
import { deleteCache } from "../../_lib/redis.js";
import { verifyClerkToken, success, error, handleOptions } from "../../_lib/auth.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const auth = await verifyClerkToken(req.headers);
    if (!auth) return error(res, "Authentication required", 401);
    const admin = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!admin || admin.role !== "ADMIN") return error(res, "Admin access required", 403);

    if (req.method === "GET") {
      const settings = await prisma.marketSettings.findMany();
      const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
      return success(res, map);
    }

    if (req.method === "PATCH") {
      const updates = Object.entries(req.body ?? {});
      if (updates.length === 0) return error(res, "No settings provided", 400);

      await Promise.all(
        updates.map(([key, value]) =>
          prisma.marketSettings.upsert({ where: { key }, update: { value }, create: { key, value } })
        )
      );

      await deleteCache("market:data");
      await prisma.auditLog.create({
        data: { actorId: admin.id, action: "SETTINGS_UPDATED", entity: "MarketSettings", metadata: { updatedKeys: Object.keys(req.body) } },
      });

      const settings = await prisma.marketSettings.findMany();
      return success(res, Object.fromEntries(settings.map(s => [s.key, s.value])));
    }

    return error(res, "Method not allowed", 405);
  } catch (err) {
    console.error("admin/settings:", err);
    error(res, "Failed to handle settings");
  }
}
