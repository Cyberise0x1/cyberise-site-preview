import crypto from "node:crypto";
import { Resend } from "resend";
import prisma from "../_lib/db.js";
import { verifyClerkToken, success, error, handleOptions } from "../_lib/auth.js";

const LINODE_API = process.env.LINODE_API_URL;
const LINODE_TOKEN = process.env.LINODE_API_TOKEN;
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET;
const resend = new Resend(process.env.RESEND_API_KEY);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function generatePassword(length = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  return Array.from(crypto.randomBytes(length), b => chars[b % chars.length]).join("");
}

async function linodeFetch(endpoint, opts = {}) {
  const res = await fetch(`${LINODE_API}${endpoint}`, {
    ...opts,
    headers: { Authorization: `Bearer ${LINODE_TOKEN}`, "Content-Type": "application/json", ...opts.headers },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Linode ${res.status}: ${body}`);
  }
  return res.json();
}

const VALID_DURATIONS = new Set([7, 14, 30, 60, 90, 180, 365]);

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return error(res, "Method not allowed", 405);

  try {
    const auth = await verifyClerkToken(req.headers);
    if (!auth) return error(res, "Authentication required", 401);

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) return error(res, "User not found", 401);
    if (user.banned) return error(res, "Account suspended", 403);

    const { plan, region, image, durationDays } = req.body ?? {};
    if (!plan || !region) return error(res, "plan and region are required", 400);
    if (durationDays && !VALID_DURATIONS.has(durationDays)) return error(res, "Invalid duration", 400);
    const days = durationDays || 30;

    const [settings, existingActive] = await Promise.all([
      prisma.marketSettings.findMany(),
      prisma.order.count({ where: { userId: user.id, status: { in: ["PENDING", "ACTIVE"] } } }),
    ]);
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
    const maxActive = map.max_active_orders ?? 5;
    if (existingActive >= maxActive) return error(res, "Maximum active orders reached", 400);

    const plansRes = await linodeFetch("/linode/types");
    const selectedPlan = plansRes.data.find(p => p.id === plan);
    if (!selectedPlan) return error(res, "Invalid plan", 400);

    const markup = map.markup_percentage ?? 20;
    const monthlyPrice = selectedPlan.price.monthly * (1 + markup / 100);
    const totalAmount = Number((monthlyPrice * (days / 30)).toFixed(2));

    if (Number(user.balance) < totalAmount) return error(res, "Insufficient balance", 400);

    const rdpPassword = generatePassword(16);
    const label = `cyberise-rdp-${user.id.slice(0, 8)}-${Date.now()}`;

    let instance;
    try {
      instance = await linodeFetch("/linode/instances", {
        method: "POST",
        body: JSON.stringify({
          region,
          type: plan,
          image: image || "linode/windows10",
          label,
          root_pass: rdpPassword,
          tags: ["cyberise-rdp"],
          booted: true,
        }),
      });
    } catch (err) {
      console.error("Linode create failed:", err);
      return error(res, "Failed to provision instance. Try a different region or plan.", 503);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const order = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { balance: { decrement: totalAmount } } });
      return tx.order.create({
        data: {
          userId: user.id,
          plan,
          region,
          image: image || "linode/windows10",
          linodeInstanceId: instance.id,
          ip: instance.ipv4[0],
          rdpUsername: "root",
          rdpPasswordEncrypted: encrypt(rdpPassword),
          status: "ACTIVE",
          amount: totalAmount,
          durationDays: days,
          expiresAt,
        },
      });
    });

    try {
      await resend.emails.send({
        from: `Cyberise RDP <${process.env.RESEND_SENDER_ADDRESS}>`,
        to: [user.email],
        subject: "Your RDP Credentials - Cyberise",
        html: credsEmail(instance.ipv4[0], rdpPassword, expiresAt),
      });
      await prisma.emailLog.create({
        data: { userId: user.id, email: user.email, subject: "RDP Credentials", status: "sent" },
      });
    } catch (err) {
      console.error("Email send failed:", err);
    }

    await prisma.auditLog.create({
      data: { actorId: user.id, action: "ORDER_CREATED", entity: "Order", entityId: order.id, metadata: { plan, region, amount: totalAmount } },
    });

    success(res, {
      orderId: order.id,
      ip: instance.ipv4[0],
      username: "root",
      password: rdpPassword,
      expiresAt,
    }, 201);
  } catch (err) {
    console.error("market-order:", err);
    error(res, "Failed to create order");
  }
}

function credsEmail(ip, password, expiresAt) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,sans-serif;color:#fff"><div style="max-width:480px;margin:40px auto;background:#12121a;border:1px solid #00f0ff33;border-radius:12px;padding:32px"><h1 style="color:#00f0ff;font-size:20px">RDP Ready</h1><p style="color:#a0a0b8">Connect using:</p><div style="background:#0a0a0f;border:1px solid #ffffff1a;border-radius:8px;padding:16px;margin:16px 0"><p style="margin:4px 0"><span style="color:#7b2ff7">IP:</span> <code>${ip}</code></p><p style="margin:4px 0"><span style="color:#7b2ff7">User:</span> <code>root</code></p><p style="margin:4px 0"><span style="color:#7b2ff7">Pass:</span> <code>${password}</code></p></div><p style="color:#666;font-size:12px">Expires: ${expiresAt.toLocaleDateString()}</p></div></body></html>`;
}
