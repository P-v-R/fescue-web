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

Work directly on `staging` for most changes:

```bash
git checkout staging
# make changes
git commit -m "feat: add member profile photo"
git push
# → Railway deploys staging automatically
# → Release PR on GitHub auto-opens/updates
```

### Feature branches

Use a branch only for multi-session work or changes you might abandon:

```bash
git checkout -b feat/my-feature
# work freely, commit message prefixes don't matter mid-branch
git checkout staging
git merge feat/my-feature
git push
```

### Releasing to production

When staging is tested and ready, merge the open release PR on GitHub.
This triggers `release.yml` which:
1. Bumps `package.json` version
2. Creates a git tag
3. Publishes a GitHub Release with changelog
4. Railway deploys production

### Commit message prefixes

The prefix on the **last commit before merging to staging** determines the version bump:

| Prefix | Bump | Example |
|---|---|---|
| `feat:` | minor | `feat: add guest booking` |
| `fix:` | patch | `fix: correct timezone bug` |
| `chore:` | patch | `chore: update deps` |
| `BREAKING:` | major | `BREAKING: new auth flow` |

### Branch protection

`main` is protected — direct pushes are blocked. All production changes must go through a PR from `staging`.
