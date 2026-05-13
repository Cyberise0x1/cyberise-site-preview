import { Router, type IRouter } from "express";
import { Webhook } from "svix";
import { prisma } from "@workspace/db";
import { sendSuccess, sendError } from "../utils/responses";
import { env } from "../utils/env";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface WebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    primary_email_address_id?: string;
    [key: string]: unknown;
  };
}

router.post("/webhooks/clerk", async (req, res) => {
  try {
    const payload = JSON.stringify(req.body);
    const headers = req.headers as Record<string, string>;

    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
    let event: WebhookEvent;

    try {
      event = wh.verify(payload, headers) as WebhookEvent;
    } catch (err) {
      logger.warn({ err }, "Invalid webhook signature");
      sendError(res, "Invalid signature", 401);
      return;
    }

    const { type, data } = event;

    switch (type) {
      case "user.created": {
        const primaryEmailId = data.primary_email_address_id;
        const email = data.email_addresses?.find(
          e => e.email_address === primaryEmailId || data.email_addresses?.[0]?.email_address
        )?.email_address;

        if (!email) {
          logger.warn({ userId: data.id }, "No email found for user");
          break;
        }

        await prisma.user.upsert({
          where: { id: data.id },
          update: { email },
          create: {
            id: data.id,
            email,
            role: "USER",
            balance: 0,
            banned: false,
          },
        });

        logger.info({ userId: data.id, email }, "User created");
        break;
      }

      case "user.updated": {
        const primaryEmailId = data.primary_email_address_id;
        const email = data.email_addresses?.find(
          e => e.email_address === primaryEmailId
        )?.email_address;

        if (email) {
          await prisma.user.update({
            where: { id: data.id },
            data: { email },
          });
        }

        logger.info({ userId: data.id }, "User updated");
        break;
      }

      case "user.deleted": {
        await prisma.user.update({
          where: { id: data.id },
          data: { banned: true },
        });

        logger.info({ userId: data.id }, "User soft-deleted");
        break;
      }

      default:
        logger.debug({ type }, "Unhandled webhook event");
    }

    sendSuccess(res, { received: true });
  } catch (error) {
    logger.error({ error }, "Webhook processing error");
    sendError(res, "Webhook processing failed");
  }
});

export default router;
