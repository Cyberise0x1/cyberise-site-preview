import prisma from "../../_lib/db.js";
import { verifyClerkToken, success, error, handleOptions } from "../../_lib/auth.js";

const LINODE_API = process.env.LINODE_API_URL;
const LINODE_TOKEN = process.env.LINODE_API_TOKEN;

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const auth = await verifyClerkToken(req.headers);
    if (!auth) return error(res, "Authentication required", 401);
    const admin = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!admin || admin.role !== "ADMIN") return error(res, "Admin access required", 403);

    if (req.method === "GET") {
      const url = new URL(req.url, "http://localhost");
      const page = Math.max(1, parseInt(url.searchParams.get("page")) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit")) || 20));
      const search = url.searchParams.get("search") || "";
      const skip = (page - 1) * limit;

      const where = search
        ? { OR: [{ id: { contains: search } }, { ip: { contains: search } }, { user: { email: { contains: search, mode: "insensitive" } } }] }
        : {};

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { email: true } } },
        }),
        prisma.order.count({ where }),
      ]);

      return success(res, { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url, "http://localhost");
      const orderId = url.searchParams.get("id") || req.query.id;
      if (!orderId) return error(res, "Order ID required", 400);

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return error(res, "Order not found", 404);

      if (order.linodeInstanceId && (order.status === "ACTIVE" || order.status === "PENDING")) {
        try {
          await fetch(`${LINODE_API}/linode/instances/${order.linodeInstanceId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${LINODE_TOKEN}` },
            signal: AbortSignal.timeout(15000),
          });
        } catch (err) {
          console.error("Linode delete failed:", err);
        }
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: "TERMINATED", terminatedAt: new Date(), terminationReason: "Admin action" },
      });

      await prisma.auditLog.create({
        data: { actorId: admin.id, action: "ORDER_TERMINATED_ADMIN", entity: "Order", entityId: orderId },
      });

      return success(res, updated);
    }

    return error(res, "Method not allowed", 405);
  } catch (err) {
    console.error("admin/orders:", err);
    error(res, "Failed to process request");
  }
}
