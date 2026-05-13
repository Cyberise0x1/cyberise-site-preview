import crypto from "node:crypto";
import { Resend } from "resend";
import prisma from "../../_lib/db.js";
import { verifyClerkToken, success, error, handleOptions } from "../../_lib/auth.js";

const ENC_KEY = process.env.ENCRYPTION_SECRET;
const LINODE_API = process.env.LINODE_API_URL;
const LINODE_TOKEN = process.env.LINODE_API_TOKEN;
const resend = new Resend(process.env.RESEND_API_KEY);

function decrypt(encrypted) {
  try {
    const [ivHex, dataHex] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const data = Buffer.from(dataHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENC_KEY.slice(0, 32)), iv);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const auth = await verifyClerkToken(req.headers);
    if (!auth) return error(res, "Authentication required", 401);

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) return error(res, "User not found", 401);

    const orderId = req.query.id;
    if (!orderId) return error(res, "Order ID required", 400);

    if (req.method === "GET") {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return error(res, "Order not found", 404);
      if (order.userId !== user.id && user.role !== "ADMIN") return error(res, "Unauthorized", 403);

      return success(res, {
        ...order,
        amount: Number(order.amount),
        balance: Number(order.balance),
        rdpPassword: order.rdpPasswordEncrypted ? decrypt(order.rdpPasswordEncrypted) : null,
      });
    }

    if (req.method === "POST") {
      const url = new URL(req.url, "http://localhost");
      if (!url.pathname.endsWith("/terminate")) return error(res, "Not found", 404);

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return error(res, "Order not found", 404);
      if (order.userId !== user.id && user.role !== "ADMIN") return error(res, "Unauthorized", 403);
      if (order.status !== "ACTIVE" && order.status !== "PENDING") return error(res, "Order is not active", 400);

      if (order.linodeInstanceId) {
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
        data: {
          status: "TERMINATED",
          terminatedAt: new Date(),
          terminationReason: user.role === "ADMIN" ? "Admin action" : "User requested",
        },
      });

      try {
        await resend.emails.send({
          from: `Cyberise RDP <${process.env.RESEND_SENDER_ADDRESS}>`,
          to: [user.email],
          subject: "RDP Service Terminated - Cyberise",
          text: `Your RDP instance (${order.ip || "N/A"}) has been terminated.`,
        });
      } catch (err) {
        console.error("Email failed:", err);
      }

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: user.role === "ADMIN" ? "ORDER_TERMINATED_ADMIN" : "ORDER_TERMINATED",
          entity: "Order",
          entityId: orderId,
        },
      });

      return success(res, updated);
    }

    return error(res, "Method not allowed", 405);
  } catch (err) {
    console.error("orders/[id]:", err);
    error(res, "Failed to process request");
  }
}
