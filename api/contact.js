import { Resend } from "resend";

const RECIPIENT_EMAIL =
  process.env.CONTACT_RECIPIENT_EMAIL ?? "Cyberisetecnologies@consultant.com";
const SENDER_ADDRESS =
  process.env.RESEND_SENDER_ADDRESS ?? "onboarding@resend.dev";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SERVICE_LABELS = {
  web: "Web/App Development",
  cyber: "Cybersecurity & Red Teaming",
  gov: "Government Consultancy",
  intel: "Intelligence & Tracking",
  other: "Other / Classified",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { name, email, service, message } = req.body ?? {};

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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Email service is not configured." });
    return;
  }

  const resend = new Resend(apiKey);
  const serviceLabel = SERVICE_LABELS[service.trim()];

  try {
    const { error } = await resend.emails.send({
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

    if (error) {
      console.error("Resend error:", error);
      res.status(502).json({ error: "Failed to send message. Please try again." });
      return;
    }
  } catch (err) {
    console.error("Resend exception:", err);
    res.status(502).json({ error: "Failed to send message. Please try again." });
    return;
  }

  res.json({ ok: true });
}
