import prisma from "../../_lib/db.js";
import { verifyClerkToken, success, error, handleOptions } from "../../_lib/auth.js";

async function requireAdmin(headers) {
  const auth = await verifyClerkToken(headers);
  if (!auth) return null;
  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return error(res, "Method not allowed", 405);

  try {
    const admin = await requireAdmin(req.headers);
    if (!admin) return error(res, "Admin access required", 403);

    const url = new URL(req.url, "http://localhost");
    const page = Math.max(1, parseInt(url.searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit")) || 20));
    const search = url.searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where = search
      ? { OR: [{ email: { contains: search, mode: "insensitive" } }, { id: { contains: search } }] }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { orders: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    success(res, { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("admin/users:", err);
    error(res, "Failed to fetch users");
  }
}
