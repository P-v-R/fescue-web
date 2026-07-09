# Fescue — Private Golf Simulator Club

A member management and reservation platform for Fescue, a private golf simulator club. Built with Next.js 16 (App Router), Supabase, Sanity CMS, and Shopify Storefront.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Auth & DB | Supabase (Postgres + Row-Level Security) |
| CMS | Sanity v3 |
| Merch | Shopify Storefront API |
| Email | Resend |
| Testing | Vitest |
| Package manager | pnpm |

---

## Features

- **Member auth** — invite-only sign-up, password login, forgot-password / change-password flows
- **Bay reservation system** — real-time availability grid, 30 min–2 hr bookings, guest support, booking detail modal
- **Member dashboard** — bulletin feed (Sanity), upcoming reservations, club events calendar
- **Member directory** — 2-column card grid with club champion plaque (Sanity-backed)
- **Admin panel** — stats dashboard, member search/profiles, book-on-behalf, membership request pipeline
- **Tour request flow** — `/contact` form feeds membership pipeline; admin tracks status and sends intro email
- **Public site** — landing page, about, location, request-a-tour contact form
- **Merch store** — Shopify-powered product pages and cart
- **Dark mode + high contrast** — member preferences, applied server-side to prevent FOUC
- **Discord integration** — admin posts events to Discord; members submit club suggestions
- **Kiosk display** — `/display` tee-sheet for wall-mounted monitor, token-gated
- **Meta Pixel** — fires on all public pages when `NEXT_PUBLIC_META_PIXEL_ID` is set

---

## Getting Started

### Prerequisites

- Node.js 22+ (see `.nvmrc`)
- pnpm
- Supabase project (staging and production)
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

See `.env.example` for all required keys. Required for local dev:

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SANITY_PROJECT_ID` + `NEXT_PUBLIC_SANITY_DATASET` + `SANITY_API_TOKEN`
- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` + `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`
- `RESEND_API_KEY` + `RESEND_FROM_ADDRESS` + `OWNER_EMAIL`
- `NEXT_PUBLIC_APP_URL`
- `REGISTRATION_ENCRYPTION_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` + `NEXT_PUBLIC_GOOGLE_MAPS_PLACE_ID` + `NEXT_PUBLIC_CLUB_ADDRESS`
- `TZ=America/Los_Angeles`

Optional (features self-disable when unset):
- `DISCORD_WEBHOOK_URL` — admin "Post to Discord" button on events
- `DISCORD_SUGGESTIONS_WEBHOOK_URL` — member Club Suggestions form
- `DISCORD_WORKBENCH_WEBHOOK_URL` + `DISCORD_APP_ID` + `DISCORD_PUBLIC_KEY` + `DISCORD_BOT_TOKEN` — Workbench Fund Discord bot
- `NEXT_PUBLIC_META_PIXEL_ID` — Meta Pixel on public marketing pages
- `DISPLAY_TOKEN` — gates the `/display` kiosk route

### Database migrations

Migrations live in `supabase/migrations/`. Create a new one with:

```bash
supabase migration new my_migration_name
```

Staging migrations run automatically on every push to `main`. Never run `supabase db push` against production manually — use `/deploy-prod` to trigger it.

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
  resend/         — email templates
  utils/          — time slots, blackout helpers, phone formatter
  validations/    — Zod schemas
sanity/           — Sanity studio schemas
supabase/
  migrations/     — SQL migrations
```

---

## Sanity Studio

The Sanity Studio is embedded at `/studio`. Run the dev server with `pnpm dev` and access it at [http://localhost:3000/studio](http://localhost:3000/studio).

---

## Deployment

Deployed on [Railway](https://railway.app) with two environments:

| Environment | Branch | URL |
|---|---|---|
| Staging | `main` | `staging.fescuegolfclub.com` |
| Production | `production` | `fescuegolfclub.com` |

---

## Development & Release Flow

Trunk-based development. `main` is the integration branch — it auto-deploys to Railway staging and runs staging DB migrations on every push.

### Day-to-day

```bash
git checkout -b feat/my-feature
# work freely, commit often
# when ready, open a PR to main:
/staging-pr
```

### Releasing to production

When staging looks good:

```bash
/deploy-prod   # fast-forwards the production branch to main
```

This triggers Railway to deploy production and runs `migrate-prod.yml` against the production DB.

### GitHub Actions

> **Note:** GitHub Actions automation is still a work in progress and not fully operational. Deployments are currently handled manually — reach out to Sean if you need something deployed or need help getting the CI/CD pipeline set up.

| Workflow | Trigger | Intended behavior |
|---|---|---|
| `ci.yml` | push to `main`/`feat/**`/`fix/**`/`chore/**`; PR to `main` | Type check, lint, test, build |
| `migrate.yml` | push to `main` | Runs `supabase db push` → staging DB |
| `migrate-prod.yml` | push to `production` | Runs `supabase db push` → production DB |
| `deploy-prod.yml` | manual | Fast-forwards `production` branch to `main` |

### Branch rules

- Never push directly to `main` — always open a PR from a feature branch
- Never push directly to `production` — coordinate with Sean for production deploys
- Never run `supabase db push` against production manually
