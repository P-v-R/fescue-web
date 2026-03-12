# Fescue — Private Golf Simulator Club

A member management and reservation platform for Fescue, a private golf simulator club. Built with Next.js 15 (App Router), Supabase, Sanity CMS, and Shopify Storefront.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Auth & DB | Supabase (Postgres + Row-Level Security) |
| CMS | Sanity v3 |
| Merch | Shopify Storefront API |
| Email | Resend |
| Package manager | pnpm |

---

## Features

- **Member auth** — invite-only sign-up, magic link / password login
- **Bay reservation system** — real-time availability grid, 1–2 hr bookings, guest support (up to 3 guests per booking / foursome)
- **Member dashboard** — bulletin feed (Sanity), upcoming reservations, club events calendar
- **Admin panel** — reservation management, blackout periods, member directory, guest leads
- **Public site** — landing page, about, request-a-tour contact form
- **Merch store** — Shopify-powered product pages and cart

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Supabase project
- Sanity project
- Shopify store (optional for merch)

### Setup

```bash
pnpm install
cp .env.example .env.local
# Fill in .env.local with your credentials
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See `.env.example` for all required keys:

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SANITY_PROJECT_ID` + `NEXT_PUBLIC_SANITY_DATASET` + `SANITY_API_TOKEN`
- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` + `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL`

### Database migrations

Migrations live in `supabase/migrations/`. Apply with:

```bash
supabase db push
```

---

## Project Structure

```
app/
  (public)/       — public-facing pages (landing, about, contact, shop)
  (member)/       — authenticated member routes (dashboard, reservations, account)
  (admin)/        — admin-only panel
  (auth)/         — login, forgot password, invite flow
components/
  bulletin/       — bulletin board + events
  reservations/   — bay grid, booking modal, upcoming reservations
  shop/           — cart, product cards
  ui/             — shared UI primitives
lib/
  supabase/       — client, admin client, queries, types
  sanity/         — client, queries
  shopify/        — storefront client
  utils/          — time slots, blackout helpers
  validations/    — Zod schemas
sanity/           — Sanity studio schemas
supabase/
  migrations/     — SQL migrations
```

---

## Sanity Studio

The Sanity Studio is embedded at `/studio`. Run the dev server with `pnpm dev` and access it directly.

---

## Deployment

Deploy to [Vercel](https://vercel.com) — connect the repo and add all environment variables from `.env.example`.

Supabase and Sanity projects are managed separately via their respective dashboards.
