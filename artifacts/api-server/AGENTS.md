# API Server

## Purpose
Express.js backend for Cyberise. Handles market orders, user management, admin operations, crypto payments, and server provisioning via Linode/RDP Monster.

## Entry Points
- `src/index.ts` - Server bootstrap
- `src/app.ts` - Express app setup, middleware chain

## Directory Structure
```
src/
├── routes/         # HTTP endpoints
│   ├── market.ts   # Plans, orders, promo codes
│   ├── admin.ts    # User/order/promo management
│   ├── webhook.ts  # NowPayments IPN callbacks
│   ├── cron.ts     # Scheduled tasks (expiry, cleanup)
│   ├── orders.ts   # User order queries
│   └── contact.ts  # Contact form
├── services/       # Business logic
│   ├── linode.ts   # Linode API client
│   ├── rdpmonster.ts # RDP Monster API client
│   ├── nowpayments.ts # Crypto payment gateway
│   ├── provisioning.ts # Instance provisioning orchestration
│   ├── promoCode.ts # Promo code validation/application
│   ├── email.ts    # Resend email service
│   └── redis.ts    # Cache layer
├── validators/     # Zod schemas
├── middleware/      # Auth, rate limiting
└── utils/          # Encryption, responses
```

## Contracts & Invariants
- All DB calls through `@workspace/db` (Prisma)
- Auth middleware: `requireAuth` → `attachUser` → `requireActiveUser`
- Promo codes: validate before provisioning, record usage in same transaction
- Balance check BEFORE provisioning — never create billable instance for underfunded user
- Crypto orders: provision only after IPN webhook confirms payment (except 100% off codes)
- All amounts in USD, stored as Decimal in DB

## Patterns
New endpoint:
1. Add Zod schema in `validators/`
2. Create route in `routes/`
3. Register in `routes/index.ts`
4. Use `sendSuccess`/`sendError` from `utils/responses`

New service:
1. Create in `services/`
2. Import in route handler
3. Add tests in same dir as `*.test.ts`

## Anti-patterns
- Never provision instance before payment/balance check
- Never expose provider branding (Linode/RDP Monster) to frontend
- Never skip promo code validation on order creation
- Never trust client-side price calculation — always recalculate server-side

## Key Flows
- **Balance order**: validate promo → calculate price → apply discount → check balance → provision → deduct balance → create order → send email
- **Crypto order**: validate promo → calculate price → apply discount → create NowPayments payment → wait for IPN webhook → provision → create order
- **100% off promo**: skip payment gateway, provision directly (same as balance flow)
