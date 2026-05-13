import prisma from "../../../../_lib/db.js";
import { verifyClerkToken, success, error, handleOptions } from "../../../../_lib/auth.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "PATCH") return error(res, "Method not allowed", 405);

  try {
    const auth = await verifyClerkToken(req.headers);
    if (!auth) return error(res, "Authentication required", 401);
    const admin = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!admin || admin.role !== "ADMIN") return error(res, "Admin access required", 403);

    const { id: userId, action } = req.query;
    if (!userId) return error(res, "User ID required", 400);
    if (action !== "ban" && action !== "unban") return error(res, "Invalid action", 400);

    const banned = action === "ban";
    const user = await prisma.user.update({ where: { id: userId }, data: { banned } });
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: banned ? "USER_BANNED" : "USER_UNBANNED",
        entity: "User",
        entityId: userId,
        metadata: { email: user.email },
      },
    });

    success(res, user);
  } catch (err) {
    console.error("admin/users/[id]/[action]:", err);
    error(res, "Failed to update user ban status");
  }
}
