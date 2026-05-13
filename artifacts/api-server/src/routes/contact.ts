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

const RECIPIENT_EMAIL =
  process.env["CONTACT_RECIPIENT_EMAIL"] ?? "Cyberisetecnologies@consultant.com";

const SENDER_ADDRESS =
  process.env["RESEND_SENDER_ADDRESS"] ?? "onboarding@resend.dev";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUCCESS_LIMIT = 3;
const WINDOW_MS = 15 * 60 * 1000;

const successMap = new Map<string, { count: number; resetAt: number }>();

function checkLimit(ip: string): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = successMap.get(ip);
  if (!entry || entry.resetAt <= now) return { limited: false, retryAfterSeconds: 0 };
  if (entry.count >= SUCCESS_LIMIT) {
    return { limited: true, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
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
  // `app.set("trust proxy", true)` makes req.ip the real client IP behind
  // a reverse proxy (Replit, Vercel, etc.), parsed from x-forwarded-for.
  const ip = req.ip ?? "unknown";

  const { limited, retryAfterSeconds } = checkLimit(ip);
  if (limited) {
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.status(429).json({ error: "Too many requests. Please try again later." });
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

  if (!apiKey) {
    logger.error("RESEND_API_KEY is not configured");
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
      logger.error({ error: bizError }, "Resend API error (business notification)");
      res.status(502).json({ error: "Failed to send message. Please try again." });
      return;
    }

    const safeName = escapeHtml(name.trim());
    const safeService = escapeHtml(serviceLabel);
    const safeMessage = escapeHtml(message.trim());

    const confirmationHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>We received your message — Cyberise Technologies</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'Inter',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;border-bottom:1px solid #00f0ff33;padding-bottom:24px;width:100%;text-align:center;">
                <span style="font-family:'Orbitron',monospace,sans-serif;font-size:26px;font-weight:700;background:linear-gradient(90deg,#00f0ff,#7b2ff7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;color:#00f0ff;letter-spacing:3px;">CYBERISE</span>
                <span style="display:block;font-family:'Inter',Arial,sans-serif;font-size:11px;font-weight:500;color:#a0a0b8;letter-spacing:4px;text-transform:uppercase;margin-top:4px;">TECHNOLOGY</span>
              </div>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#12121a;border:1px solid #00f0ff22;border-radius:12px;overflow:hidden;">

              <!-- Top accent bar -->
              <div style="height:3px;background:linear-gradient(90deg,#00f0ff,#7b2ff7,#ff2d55);"></div>

              <!-- Card body -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 36px 32px;">

                    <!-- Greeting -->
                    <p style="margin:0 0 8px;font-family:'Orbitron',monospace,sans-serif;font-size:13px;font-weight:700;color:#00f0ff;letter-spacing:2px;text-transform:uppercase;">// TRANSMISSION RECEIVED</p>
                    <h1 style="margin:0 0 20px;font-family:'Inter',Arial,sans-serif;font-size:24px;font-weight:500;color:#ffffff;line-height:1.3;">Hi ${safeName},</h1>

                    <!-- Body copy -->
                    <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#a0a0b8;line-height:1.7;">
                      Thank you for reaching out to Cyberise Technologies. We have received your inquiry and our team will get back to you within <strong style="color:#ffffff;">1–2 business days</strong>.
                    </p>

                    <!-- Divider -->
                    <div style="height:1px;background:linear-gradient(90deg,transparent,#00f0ff44,transparent);margin-bottom:28px;"></div>

                    <!-- Inquiry summary -->
                    <p style="margin:0 0 16px;font-family:'Orbitron',monospace,sans-serif;font-size:11px;font-weight:700;color:#7b2ff7;letter-spacing:2px;text-transform:uppercase;">Your Inquiry Summary</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;border:1px solid #00f0ff1a;border-radius:8px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom:14px;border-bottom:1px solid #ffffff0d;padding-top:0;">
                                <span style="font-family:'Inter',Arial,sans-serif;font-size:11px;font-weight:500;color:#7b2ff7;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;">Service</span>
                                <span style="font-family:'Inter',Arial,sans-serif;font-size:14px;color:#ffffff;">${safeService}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:14px;">
                                <span style="font-family:'Inter',Arial,sans-serif;font-size:11px;font-weight:500;color:#7b2ff7;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Your Message</span>
                                <span style="font-family:'Inter',Arial,sans-serif;font-size:14px;color:#a0a0b8;line-height:1.6;display:block;white-space:pre-wrap;">${safeMessage}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA note -->
                    <p style="margin:0 0 0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#a0a0b8;line-height:1.7;">
                      If you have any urgent questions in the meantime, simply reply to this email and we'll respond as soon as possible.
                    </p>

                  </td>
                </tr>

                <!-- Signature -->
                <tr>
                  <td style="padding:0 36px 36px;">
                    <div style="height:1px;background:linear-gradient(90deg,transparent,#7b2ff744,transparent);margin-bottom:24px;"></div>
                    <p style="margin:0 0 2px;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#ffffff;font-weight:500;">The Cyberise Technologies Team</p>
                    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#a0a0b8;">Cybersecurity &bull; Intelligence &bull; Development &bull; Consultancy</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#a0a0b844;line-height:1.6;">
                This is an automated confirmation. Please do not reply directly to this address<br />if you received this in error, you may safely disregard it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { error: confirmError } = await resend.emails.send({
      from: `Cyberise Technologies <${SENDER_ADDRESS}>`,
      to: [email.trim()],
      subject: "We received your message — Cyberise Technologies",
      html: confirmationHtml,
      text: [
        `Hi ${name.trim()},`,
        ``,
        `Thank you for reaching out to Cyberise Technologies. We have received your inquiry regarding "${serviceLabel}" and our team will get back to you within 1–2 business days.`,
        ``,
        `Here is a summary of what you sent us:`,
        ``,
        `  Service: ${serviceLabel}`,
        `  Message: ${message.trim()}`,
        ``,
        `If you have any urgent questions in the meantime, feel free to reply to this email.`,
        ``,
        `Best regards,`,
        `The Cyberise Technologies Team`,
      ].join("\n"),
    });

    if (confirmError) {
      logger.warn({ error: confirmError }, "Resend API error (visitor confirmation) — business email was sent");
    }
  } catch (err) {
    logger.error({ err }, "Resend transport error");
    res.status(502).json({ error: "Failed to send message. Please try again." });
    return;
  }

  recordSuccess(ip);
  res.json({ ok: true });
});

export default router;
