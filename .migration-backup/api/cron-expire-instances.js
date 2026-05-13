import { PrismaClient } from "@prisma/client";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";

const prisma = new PrismaClient();
const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});
const resend = new Resend(process.env.RESEND_API_KEY);

const LINODE_API_BASE = process.env.LINODE_API_URL;
const LINODE_TOKEN = process.env.LINODE_API_TOKEN;

async function deleteLinodeInstance(instanceId) {
  await fetch(`${LINODE_API_BASE}/linode/instances/${instanceId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${LINODE_TOKEN}` },
  });
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  try {
    const now = new Date();
    const reminderThreshold = new Date();
    reminderThreshold.setDate(reminderThreshold.getDate() + 3);

    const expiredOrders = await prisma.order.findMany({
      where: { status: "ACTIVE", expiresAt: { lt: now } },
      include: { user: true },
    });

    let terminated = 0;
    for (const order of expiredOrders) {
      try {
        if (order.linodeInstanceId) {
          await deleteLinodeInstance(order.linodeInstanceId);
        }
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "TERMINATED",
            terminatedAt: now,
            terminationReason: "Expired",
          },
        });
        await prisma.auditLog.create({
          data: {
            actorId: order.userId,
            action: "ORDER_EXPIRED",
            entity: "Order",
            entityId: order.id,
          },
        });
        terminated++;
      } catch (err) {
        console.error(`Failed to terminate order ${order.id}:`, err);
      }
    }

    const upcoming = await prisma.order.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { gt: now, lt: reminderThreshold },
      },
      include: { user: true },
    });

    let reminders = 0;
    for (const order of upcoming) {
      if (!order.ip || !order.user?.email) continue;
      try {
        const daysLeft = Math.ceil((order.expiresAt.getTime() - Date.now()) / 86400000);
        await resend.emails.send({
          from: `Cyberise RDP <${process.env.RESEND_SENDER_ADDRESS}>`,
          to: [order.user.email],
          subject: "RDP Renewal Reminder - Cyberise",
          text: `Your RDP service (${order.ip}) expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} on ${order.expiresAt.toLocaleDateString()}. Visit your dashboard to renew.`,
        });
        reminders++;
      } catch (err) {
        console.error(`Failed reminder for order ${order.id}:`, err);
      }
    }

    console.log(`Cron: terminated=${terminated} reminders=${reminders}`);
    res.json({ success: true, data: { terminated, remindersSent: reminders, timestamp: now.toISOString() } });
  } catch (error) {
    console.error("Cron failed:", error);
    res.status(500).json({ success: false, error: "Cron job failed" });
  }
}
