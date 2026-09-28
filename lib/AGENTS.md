# Shared Libraries

## Purpose

Shared packages used by api-server and cyberise frontend. Published as `@workspace/*` within pnpm workspace.

## Packages

### `db` — Database layer

- Prisma schema + client
- Models: User, Order, PromoCode, PromoCodeUsage, CryptoPayment, AuditLog, MarketSettings
- Always use `@workspace/db` for DB access — never raw Prisma import

### `api-spec` — API type definitions

- Shared types between frontend and backend
- Market data, order types, plan types

### `api-client-react` — React API hook

- `useApi()` hook for frontend
- Handles auth headers, error parsing

### `api-zod` — Shared Zod schemas

- Validation schemas shared between services

### `env` — Environment config

- Centralized env var validation
- Type-safe access to process.env

## Contracts & Invariants

- DB schema changes require migration in `db/prisma/`
- API type changes must update both `api-spec` and `api-client-react`
- Never import `db` from frontend code — use API endpoints

## Patterns

New shared type:

1. Add to `api-spec/src/types.ts`
2. Export from `api-spec/src/index.ts`
3. Import in both frontend and backend

New DB model:

1. Add to `db/prisma/schema.prisma`
2. Run `pnpm --filter @workspace/db run generate`
3. Run migration
