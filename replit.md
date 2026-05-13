# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Deployment

This project ships in two ways:

### Replit (development + preview)

Three workflows run side-by-side:
- `artifacts/cyberise: web` — Vite dev server for the frontend (port 22231)
- `artifacts/api-server: API Server` — Express API (port 8080)
- `artifacts/mockup-sandbox: Component Preview Server` — design canvas (port 8081)

### Vercel (production)

`vercel.json` at the repo root configures a hybrid static + serverless deploy:
- **Frontend**: `pnpm --filter @workspace/cyberise run build` outputs to `artifacts/cyberise/dist/public` and is served as static assets. SPA fallback rewrites unmatched paths to `/index.html`.
- **API**: `api/index.ts` re-exports the Express app from `artifacts/api-server/src/app.ts`. Vercel auto-detects the `api/` directory and runs each file as a Node serverless function. The rewrite `/api/(.*) → /api` sends all `/api/*` requests through the Express app, which handles its own routing.

**Required Vercel env vars** (Project Settings → Environment Variables, all environments):
- `RESEND_API_KEY` (secret)
- `CONTACT_RECIPIENT_EMAIL` (e.g. `Cyberisetecnologies@consultant.com`)
- `RESEND_SENDER_ADDRESS` (must be on a domain verified in Resend)

**Build env vars** (already set in `vercel.json`):
- `PORT=3000`, `BASE_PATH=/`, `NODE_ENV=production` — required by `vite.config.ts` at build time.

**Caveats**:
- The contact-form rate limiter (`successMap` in `routes/contact.ts`) is per-instance memory. On Vercel serverless the cap effectively becomes "3-per-instance per 15 min." Swap to Vercel KV / Upstash if you need true per-IP enforcement.
- `pino-pretty` is dev-only; production uses plain JSON pino logs (compatible with serverless).
- Express `app.set("trust proxy", true)` is enabled so `req.ip` reflects the real client behind Vercel's edge.
