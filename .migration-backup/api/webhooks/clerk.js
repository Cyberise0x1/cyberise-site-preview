import { Webhook } from "svix";
import prisma from "../_lib/db.js";
import { success, error } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return error(res, "Method not allowed", 405);

  try {
    const payload = JSON.stringify(req.body);
    const headers = req.headers;

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    let event;
    try {
      event = wh.verify(payload, headers);
    } catch {
      return error(res, "Invalid signature", 401);
    }

    const { type, data } = event;

    switch (type) {
      case "user.created": {
        const email = data.email_addresses?.find(e => e.id === data.primary_email_address_id)?.email_address
          ?? data.email_addresses?.[0]?.email_address;
        if (!email) break;

        await prisma.user.upsert({
          where: { id: data.id },
          update: { email },
          create: { id: data.id, email, role: "USER", balance: 0, banned: false },
        });
        break;
      }
      case "user.updated": {
        const email = data.email_addresses?.find(e => e.id === data.primary_email_address_id)?.email_address;
        if (email) {
          await prisma.user.update({ where: { id: data.id }, data: { email } });
        }
        break;
      }
      case "user.deleted": {
        await prisma.user.update({ where: { id: data.id }, data: { banned: true } });
        break;
      }
    }

    success(res, { received: true });
  } catch (err) {
    console.error("webhooks/clerk:", err);
    error(res, "Webhook processing failed");
  }
}
