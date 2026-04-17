# Fescue Web — Project Memory

## Project
- Private golf simulator club membership app
- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Supabase (auth + DB), Sanity v3 (CMS), Shopify Storefront API, Resend
- Package manager: **pnpm**
- See `fescue-build-guide.md` for full spec and 10 build prompts

## Key files
- `fescue-build-guide.md` — full spec, DB schema, prompts 1–10
- `fescue-style-guide (1).html` — brand style guide (HTML file, large)
- `memory/style-guide.md` — extracted design tokens (see below)

## Build progress
- [x] Prompt 1 — Project init (deps, folder structure, env files)
- [x] Prompt 2 — Supabase schema + migrations + queries
- [x] Prompt 3 — Auth + invite flow (middleware, login, forgot-pw, invite, logout)
- [x] Prompt 4 — Reservation system (bay grid, booking modal, realtime, account page)
- [x] Prompt 5 — Sanity CMS setup (schemas, studio, client, queries, docs)
- [x] Prompt 6 — Member dashboard + calendar (bulletin feed, sidebar events, FullCalendar, event modal)
- [ ] Prompt 7 — Shopify merch store
- [ ] Prompt 8 — Admin panel
- [ ] Prompt 9 — CI/CD + testing
- [ ] Prompt 10 — Documentation

## Git workflow
- **Always use feature branches** (`feat/*`, `fix/*`) — branch protection blocks direct pushes to `staging`, must go through a PR
- Release Please has been removed — CI/CD is now 3 workflows: `ci.yml`, `migrate.yml` (staging DB), `migrate-prod.yml` (prod DB)
- **Deploy PRs must be built off `main`**, not opened from `staging` → `main` directly (squash-merge history causes massive false conflicts)
- See `memory/feedback-deploy-pr-process.md` for the exact deploy PR commands

## Backlog / feature notes
- See `memory/project-reservation-improvements.md` — reservation tab UX improvements (date arrows, 30min option, 2hr player note)

## Key patterns / notes
- Zod v4: use `.issues` not `.errors` on ZodError
- Server actions return `{ error: string } | { data }` — never throw to client
- cancelBookingAction lives in reservations/actions.ts (not account/actions.ts)
- Supabase realtime needs enabling in dashboard: Database → Replication → bookings table
- `BookingWithBay` type in lib/supabase/types.ts for account page joins

## Feedback
- `memory/feedback-staging-deploy-flow.md` — Always open a PR to staging, never push directly
