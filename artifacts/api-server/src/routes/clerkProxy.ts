import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const router = Router();

const clerkDomain = process.env.CLERK_SECRET_KEY
  ? (() => {
      const pk = process.env.CLERK_PUBLISHABLE_KEY || "";
      const suffix = pk.replace(/^pk_(live|test)_/, "");
      try {
        return Buffer.from(suffix, "base64")
          .toString("utf8")
          .replace(/\$$/, "");
      } catch {
        return "clerk.cyberise.org";
      }
    })()
  : "clerk.cyberise.org";

router.use(
  "/clerk",
  createProxyMiddleware({
    target: `https://${clerkDomain}`,
    changeOrigin: true,
    pathRewrite: { "^/api/clerk": "" },
    on: {
      error: (err, _req, res: any) => {
        res.status(502).json({ error: "Clerk proxy error" });
      },
    },
  }),
);

export default router;
