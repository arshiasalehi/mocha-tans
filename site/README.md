# Mocha Tans Full-Stack Site

Production-ready Next.js App Router rebuild for Mocha Tans with Supabase + Stripe.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- Supabase (auth + database + RLS)
- Stripe Checkout + Webhooks
- Vitest (unit tests)

## Features Implemented

- Bilingual FR/EN storefront (French-first)
- Service booking flow with availability engine
- Booking checkout via Stripe
- Product shop + cart + Stripe checkout
- Booking cancellation and reschedule APIs
- Stripe webhook processing with idempotent status updates
- Owner-only `/admin` panel with modules:
  - Dashboard
  - Bookings
  - Services
  - Products
  - Orders
  - FAQ/Reviews
  - Media
  - Settings (hours/rules/policies/business profile)

## Required Environment Variables

Create `site/.env.local` (example in `site/.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_TAX_RATE_GST_ID`
- `STRIPE_TAX_RATE_QST_ID`
- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`
- `NEXT_PUBLIC_SITE_URL`

## Local Setup

From `site/`:

```bash
npm install
npm run lint
npm run test
npm run dev
```

## Supabase

1. Run SQL migration:
   - `site/supabase/migrations/202605171300_initial.sql`
2. Seed business data:

```bash
npm run seed
```

## Stripe Webhook (local)

Point Stripe CLI to local app:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then copy the generated webhook secret into `STRIPE_WEBHOOK_SECRET`.

## API Surface

- `GET /api/availability?serviceId&date=YYYY-MM-DD`
- `POST /api/bookings/checkout-session`
- `POST /api/bookings/reschedule`
- `POST /api/bookings/cancel`
- `POST /api/shop/checkout-session`
- `POST /api/stripe/webhook`

Response contract:

- success: `{ ok: true, data: ... }`
- error: `{ ok: false, code, message }`
