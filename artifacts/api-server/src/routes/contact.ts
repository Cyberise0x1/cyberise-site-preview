import { Router, type IRouter } from "express";
import { Resend } from "resend";
import { logger } from "../lib/logger";

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const router: IRouter = Router();

const RECIPIENT_EMAIL = process.env["CONTACT_RECIPIENT_EMAIL"];
const SENDER_ADDRESS = process.env["RESEND_SENDER_ADDRESS"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUCCESS_LIMIT = 3;
const WINDOW_MS = 15 * 60 * 1000;

const successMap = new Map<string, { count: number; resetAt: number }>();

function checkLimit(ip: string): {
  limited: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const entry = successMap.get(ip);
  if (!entry || entry.resetAt <= now)
    return { limited: false, retryAfterSeconds: 0 };
  if (entry.count >= SUCCESS_LIMIT) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { limited: false, retryAfterSeconds: 0 };
}

function recordSuccess(ip: string): void {
  const now = Date.now();
  const entry = successMap.get(ip);
  if (!entry || entry.resetAt <= now) {
    successMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

const SERVICE_LABELS: Record<string, string> = {
  web: "Web/App Development",
  cyber: "Cybersecurity & Red Teaming",
  gov: "Government Consultancy",
  intel: "Intelligence & Tracking",
  other: "Other / Classified",
};

router.post("/contact", async (req, res) => {
  const ip = req.ip ?? "unknown";

  const { limited, retryAfterSeconds } = checkLimit(ip);
  if (limited) {
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
    return;
  }

  const { name, email, service, message } = req.body as {
    name?: string;
    email?: string;
    service?: string;
    message?: string;
  };

  if (!name?.trim() || !email?.trim() || !service?.trim() || !message?.trim()) {
    res.status(400).json({ error: "All fields are required." });
    return;
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    res.status(400).json({ error: "Please provide a valid email address." });
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(SERVICE_LABELS, service.trim())) {
    res.status(400).json({ error: "Invalid service selection." });
    return;
  }

  const apiKey = process.env["RESEND_API_KEY"];

  if (!apiKey || !RECIPIENT_EMAIL || !SENDER_ADDRESS) {
    logger.error(
      "Email service environment variables are not fully configured",
    );
    res.status(503).json({ error: "Email service is not configured." });
    return;
  }

  const resend = new Resend(apiKey);
  const serviceLabel = SERVICE_LABELS[service.trim()];

  try {
    const { error: bizError } = await resend.emails.send({
      from: `Cyberise Contact Form <${SENDER_ADDRESS}>`,
      to: [RECIPIENT_EMAIL],
      replyTo: email.trim(),
      subject: `New Inquiry: ${serviceLabel} — from ${name.trim()}`,
      text: [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        `Service: ${serviceLabel}`,
        ``,
        `Message:`,
        message.trim(),
      ].join("\n"),
    });

    if (bizError) {
      logger.error(
        { error: bizError },
        "Resend API error (business notification)",
      );
      res
        .status(502)
        .json({ error: "Failed to send message. Please try again." });
      return;
    }

    const safeName = escapeHtml(name.trim());
    const safeService = escapeHtml(serviceLabel);
    const safeMessage = escapeHtml(message.trim());

    await resend.emails.send({
      from: `Cyberise Technologies <${SENDER_ADDRESS}>`,
      to: [email.trim()],
      subject: "We received your message — Cyberise Technologies",
      text: [
        `Hi ${name.trim()},`,
        ``,
        `Thank you for reaching out to Cyberise Technologies. We have received your inquiry regarding "${serviceLabel}" and our team will get back to you within 1–2 business days.`,
        ``,
        `Best regards,`,
        `The Cyberise Technologies Team`,
      ].join("\n"),
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>We received your message</title></head><body style="margin:0;padding:0;background:#0a0a0f;font-family:sans-serif;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;"><table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0"><tr><td style="background:#12121a;border:1px solid #00f0ff22;border-radius:12px;padding:40px;"><h1 style="color:#fff;margin:0 0 8px;">Hi ${safeName},</h1><p style="color:#a0a0b8;">Thank you for reaching out. We received your inquiry about <strong style="color:#fff;">${safeService}</strong> and will get back to you within 1–2 business days.</p><p style="color:#a0a0b8;font-size:12px;">Your message: ${safeMessage}</p></td></tr></table></td></tr></table></body></html>`,
    });
  } catch (err) {
    logger.error({ err }, "Resend transport error");
    res
      .status(502)
      .json({ error: "Failed to send message. Please try again." });
    return;
  }

  recordSuccess(ip);
  res.json({ ok: true });
});

export default router;
