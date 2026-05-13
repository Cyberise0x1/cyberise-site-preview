import prisma from "../_lib/db.js";
import { verifyClerkToken, success, error, handleOptions } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return error(res, "Method not allowed", 405);

  try {
    const auth = await verifyClerkToken(req.headers);
    if (!auth) return error(res, "Authentication required", 401);

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) return error(res, "User not found", 401);

    const url = new URL(req.url, "http://localhost");
    const statusFilter = url.searchParams.get("status");

    const where = { userId: user.id };
    if (statusFilter && ["ACTIVE", "PENDING", "TERMINATED", "FAILED"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    success(res, orders);
  } catch (err) {
    console.error("orders:", err);
    error(res, "Failed to fetch orders");
  }
}
