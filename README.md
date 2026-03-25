# Fescue — Private Golf Simulator Club

A member management and reservation platform for Fescue, a private golf simulator club. Built with Next.js 15 (App Router), Supabase, Sanity CMS, and Shopify Storefront.

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

- **Member auth** — invite-only sign-up, password login, forgot-password flow
- **Bay reservation system** — real-time availability grid, 1–2 hr bookings, guest support
- **Member dashboard** — bulletin feed (Sanity), upcoming reservations, club events calendar
- **Member directory** — 2-column card grid with club champion plaque (Sanity-backed)
- **Admin panel** — stats dashboard, member search/profiles, book-on-behalf, membership request pipeline with intro email (Resend)
- **Tour request flow** — `/contact` form feeds membership pipeline; admin can send intro email and track status
- **Public site** — landing page, about, request-a-tour contact form
- **Merch store** — Shopify-powered product pages and cart (in progress)

---

## Getting Started

### Prerequisites

- Node.js 22+ (see `.nvmrc`)
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

Migrations live in `supabase/migrations/`. Create a new one with:

```bash
supabase migration new my_migration_name
```

Production migrations run automatically when a release PR is merged to `main` (via `release.yml`). Never run `supabase db push` against production manually.

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

The Sanity Studio is embedded at `/studio`. Run the dev server with `pnpm dev` and access it directly.

---

## Deployment

Deployed on [Railway](https://railway.app) with two environments:

| Environment | Branch | URL |
|---|---|---|
| Staging | `staging` | `fescue-web-staging.up.railway.app` |
| Production | `main` | `fescuegolf.com` |

Both environments require all variables from `.env.example`, plus `TZ=America/Los_Angeles`.

Supabase and Sanity projects are managed separately via their respective dashboards.

---

## Development & Release Flow

### Day-to-day

All work happens on a feature branch. Never commit directly to `staging`.

```bash
git checkout -b feat/my-feature
# work freely — commit messages here don't affect versioning
git checkout staging
git merge --squash feat/my-feature
git commit -m "feat: describe the feature"   # this message drives the changelog
git push origin staging
# → Railway deploys staging automatically
git branch -d feat/my-feature
```

### Releasing to production

When staging is tested and ready, merge the open Release Please PR on GitHub (`chore: release X.Y.Z`). This automatically:
1. Tags the release
2. Runs database migrations against production (`release.yml`)
3. Railway deploys production from `main`

### Commit message prefixes

The squash commit message when merging into `staging` determines the version bump:

| Prefix | Bump | Example |
|---|---|---|
| `feat:` | minor | `feat: add guest booking` |
| `fix:` | patch | `fix: correct timezone bug` |
| `chore:` | patch (hidden) | `chore: update deps` |
| `BREAKING CHANGE:` | major | `BREAKING CHANGE: new auth flow` |

### Branch protection

`main` is protected — direct pushes are blocked. The Release Please bot owns the `staging → main` PR; never open one manually.
