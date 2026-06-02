import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

// Webhook signature verification (Clerk/svix, NowPayments) must run against the
// exact raw request bytes, but the global JSON parser consumes the stream. We
// stash the raw buffer for webhook paths via express.json's `verify` hook.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

const app: Express = express();

app.set("trust proxy", true);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://cyberise.org", "https://www.cyberise.org"]
        : "*",
    exposedHeaders: [
      "Retry-After",
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
    ],
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      // Only webhook routes need the raw bytes; avoid retaining buffers
      // elsewhere.
      if (req.url?.includes("/webhooks/")) {
        (req as express.Request).rawBody = buf;
      }
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

export default app;
