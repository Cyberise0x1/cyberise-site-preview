import { Resend } from "resend";
import { env } from "../utils/env";
import { logger } from "../lib/logger";
import { prisma } from "@workspace/db";

const resend = new Resend(env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
}

export async function sendEmail(
  options: EmailOptions,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: `Cyberise RDP <${env.RESEND_SENDER_ADDRESS}>`,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    const status = error ? "failed" : "sent";

    if (options.userId) {
      await prisma.emailLog.create({
        data: {
          userId: options.userId,
          email: options.to,
          subject: options.subject,
          status,
          error: error?.message ?? null,
        },
      });
    }

    if (error) {
      logger.error({ error, to: options.to }, "Failed to send email");
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    logger.error({ err, to: options.to }, "Email service error");
    return { success: false, error: "Internal email error" };
  }
}

export function generateRDPCredentialsEmail(params: {
  ip: string;
  username: string;
  password: string;
  expiresAt: Date;
}): { html: string; text: string } {
  const { ip, username, password, expiresAt } = params;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your RDP Credentials</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e,#0f0f1a);border:1px solid #00f0ff33;border-radius:12px;overflow:hidden;">
              <div style="height:4px;background:linear-gradient(90deg,#00f0ff,#7b2ff7);"></div>
              <div style="padding:32px;">
                <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;">Your RDP is Ready</h1>
                <p style="margin:0 0 24px;color:#a0a0b8;">Connect to your Windows RDP using the credentials below.</p>
                <div style="background:#12121a;border:1px solid #00f0ff22;border-radius:8px;padding:20px;margin-bottom:20px;">
                  <div style="margin-bottom:16px;">
                    <span style="color:#7b2ff7;font-size:12px;text-transform:uppercase;letter-spacing:1px;">IP Address</span>
                    <div style="color:#00f0ff;font-size:18px;font-family:monospace;margin-top:4px;">${ip}</div>
                  </div>
                  <div style="margin-bottom:16px;">
                    <span style="color:#7b2ff7;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Username</span>
                    <div style="color:#ffffff;font-size:16px;font-family:monospace;margin-top:4px;">${username}</div>
                  </div>
                  <div>
                    <span style="color:#7b2ff7;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Password</span>
                    <div style="color:#ffffff;font-size:16px;font-family:monospace;margin-top:4px;">${password}</div>
                  </div>
                </div>
                <div style="background:#1a1a2e;border-radius:8px;padding:16px;margin-bottom:20px;">
                  <p style="margin:0;color:#a0a0b8;font-size:14px;">
                    <strong style="color:#ffffff;">Expires:</strong> ${expiresAt.toLocaleDateString()}
                  </p>
                </div>
                <p style="margin:0;color:#666;font-size:12px;">
                  Keep these credentials secure. You can also access them from your dashboard.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Your RDP is Ready

Connect to your Windows RDP using these credentials:

IP Address: ${ip}
Username: ${username}
Password: ${password}

Expires: ${expiresAt.toLocaleDateString()}

Keep these credentials secure. You can also access them from your dashboard.`;

  return { html, text };
}

export function generateTerminationEmail(params: {
  ip: string;
  terminatedAt: Date;
}): { html: string; text: string } {
  const { ip, terminatedAt } = params;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>RDP Service Terminated</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e,#0f0f1a);border:1px solid #ff444433;border-radius:12px;overflow:hidden;">
              <div style="height:4px;background:linear-gradient(90deg,#ff4444,#ff8800);"></div>
              <div style="padding:32px;">
                <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;">RDP Service Terminated</h1>
                <p style="margin:0 0 24px;color:#a0a0b8;">Your RDP instance has been terminated.</p>
                <div style="background:#12121a;border:1px solid #ff444422;border-radius:8px;padding:20px;">
                  <p style="margin:0 0 8px;color:#a0a0b8;">IP Address: <span style="color:#ffffff;font-family:monospace;">${ip}</span></p>
                  <p style="margin:0;color:#a0a0b8;">Terminated: <span style="color:#ffffff;">${terminatedAt.toLocaleString()}</span></p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `RDP Service Terminated

Your RDP instance has been terminated.

IP Address: ${ip}
Terminated: ${terminatedAt.toLocaleString()}

To continue using RDP services, please place a new order.`;

  return { html, text };
}

export function generateRenewalReminderEmail(params: {
  ip: string;
  expiresAt: Date;
}): { html: string; text: string } {
  const { ip, expiresAt } = params;
  const daysLeft = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>RDP Renewal Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e,#0f0f1a);border:1px solid #00f0ff33;border-radius:12px;overflow:hidden;">
              <div style="height:4px;background:linear-gradient(90deg,#00f0ff,#7b2ff7);"></div>
              <div style="padding:32px;">
                <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;">RDP Renewal Reminder</h1>
                <p style="margin:0 0 24px;color:#a0a0b8;">Your RDP service expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.</p>
                <div style="background:#12121a;border:1px solid #00f0ff22;border-radius:8px;padding:20px;">
                  <p style="margin:0 0 8px;color:#a0a0b8;">IP Address: <span style="color:#00f0ff;font-family:monospace;">${ip}</span></p>
                  <p style="margin:0;color:#a0a0b8;">Expires: <span style="color:#ffffff;">${expiresAt.toLocaleDateString()}</span></p>
                </div>
                <p style="margin:20px 0 0;color:#666;font-size:14px;">
                  Visit your dashboard to renew your service.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `RDP Renewal Reminder

Your RDP service expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.

IP Address: ${ip}
Expires: ${expiresAt.toLocaleDateString()}

Visit your dashboard to renew your service.`;

  return { html, text };
}
