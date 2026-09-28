# Cyberise Frontend

## Purpose

React + Vite SPA for cyberise.org. Landing page, server marketplace, user dashboard, admin panel.

## Entry Points

- `src/main.tsx` - App bootstrap, ClerkProvider + QueryClientProvider
- `src/App.tsx` - Route definitions

## Directory Structure

```
src/
├── components/     # Shared UI components
│   ├── ui/         # Radix + shadcn primitives
│   ├── Navbar.tsx  # Navigation with auth
│   ├── Hero.tsx    # Landing hero section
│   ├── Footer.tsx  # Footer with legal modals
│   └── AppShell.tsx # App layout wrapper
├── pages/          # Route pages
│   ├── Market.tsx  # Server marketplace + checkout
│   ├── Dashboard.tsx # User dashboard
│   ├── Orders.tsx  # Order history
│   ├── AdminUsers.tsx  # Admin user management
│   ├── AdminOrders.tsx # Admin order management
│   └── AdminSettings.tsx # Admin config + promo codes
├── hooks/          # Custom React hooks
└── lib/            # Utilities, API client
```

## Contracts & Invariants

- Auth via Clerk — `useAuth()` for state, `useUser()` for profile
- API calls through `useApi()` hook — handles auth headers
- Balance stored in `user.publicMetadata.balance` (set by backend webhook)
- Price calculation is display-only — backend recalculates on order

## Patterns

New page:

1. Create component in `pages/`
2. Add route in `App.tsx` `<Switch>`
3. Wrap in `<AppShell>` for layout
4. Use `useApi()` for data fetching

New component:

1. Check `components/ui/` for existing primitives
2. Use Tailwind + cn() for styling
3. Framer Motion for animations

## Key State (Market.tsx)

- `selectedPlan` / `selectedRegion` / `duration` — order config
- `promoCode` / `promoApplied` / `promoDiscount` — promo state
- `paymentMethod` — "balance" | "crypto"
- `credentials` — post-order server credentials dialog

## Anti-patterns

- Don't hardcode prices — always use API response
- Don't skip promo validation before order
- Don't show provider branding (Linode/RDP Monster)
- Don't assume balance is sufficient — backend checks
