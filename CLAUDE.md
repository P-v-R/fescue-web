# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint check
```

Testing uses **Vitest** (v2) with jsdom. Run with `pnpm test` or `pnpm test:watch`. Test files live in `tests/`.

## Architecture

### Tech Stack
- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase** — auth + database (PostgreSQL with RLS)
- **Sanity v3** — CMS for bulletin posts and events
- **Shopify Storefront API** — merch store
- **Resend** — transactional email
- Package manager: **pnpm**

### Route Groups

```
app/
├── (auth)/       # /login, /forgot-password, /invite/[token]
├── (member)/     # /dashboard, /calendar, /reservations, /account
├── (admin)/      # /admin — requires is_admin + is_active
├── (public)/     # /, /about, /membership, /contact, /shop
└── studio/       # Embedded Sanity Studio (admin-only)
```

### Route Protection

`proxy.ts` (the actual middleware) guards routes by checking Supabase `getUser()` (not `getSession()` — avoids token spoofing). It validates `is_admin` and `is_active` flags from the `members` table. Deactivated members are signed out immediately.

### Supabase Clients

Three separate clients with distinct scopes:

| File | Client | Use |
|------|--------|-----|
| `lib/supabase/server.ts` | `createServerClient` | Server Components, Server Actions, Route Handlers |
| `lib/supabase/client.ts` | `createBrowserClient` | Client components, realtime subscriptions |
| `lib/supabase/admin.ts` | Service role | Bypasses RLS — server-side only, never expose to browser |

### Server Actions Pattern

All mutations go through server actions that return `{ error: string }` or `{ data: T }` — they never throw to the client.

```typescript
'use server'
export async function myAction(input: InputType) {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  // ... perform operation, call revalidatePath() on success
}
```

### Validation

Zod v4 is used for all input validation. **Important:** use `.issues` not `.errors` on `ZodError`.

Schemas live in `lib/validations/`: `auth.ts` (login, forgot-password, accept-invite), `booking.ts`, and `membership-request.ts`.

### Sanity CMS

Two clients in `lib/sanity/client.ts`:
- `sanityClient` — read-only, CDN-cached, safe for Server Components
- `sanityWriteClient` — authenticated write client, server-side only

### Design Tokens

Brand CSS variables are defined in `app/globals.css`. Key colors: `--navy` (`#004225` forest green — **not blue**), `--cream`, `--sage`, `--sand`, `--gold` (each with `-dark`, `-mid`, `-light` variants). Fonts: **Playfair Display** (serif/headings), **Libre Baskerville** (sans/body), **DM Mono** (mono/labels), **Pinyon Script** (decorative script). Tailwind v4 color utilities require `--color-*` CSS variables — see globals.css `@theme inline` block.

> The brand color is deep hunter/forest green (#004225), not navy blue. All Tailwind `navy` utilities map to this green via CSS variables.

### Utilities

`lib/utils/phone.ts` — `formatPhone(value)` formats a string to `(###) ###-####` as the user types. Apply to all phone inputs via `onChange`.

### Key Types

`lib/supabase/types.ts` contains all database types. `BookingWithBay` is the join type used on the account page. **When adding DB columns, always add them to the corresponding type in `types.ts` manually** — there is no Supabase type-gen in this project.

### Dark Mode & High Contrast

Both are toggled in `/account` preferences and persisted as boolean columns on `members` (`dark_mode`, `high_contrast`). They are applied by an **inline `<script>` block** rendered in `app/(member)/layout.tsx` — this runs synchronously before React hydration to prevent flash-of-unstyled-content (FOUC). Do NOT use `useEffect`-based appliers for this.

CSS overrides live in `app/globals.css` under `html.dark-mode`, `html.high-contrast`, and `html.dark-mode.high-contrast` selectors. When adding new Tailwind opacity variants (e.g. `text-navy/75`), add a corresponding dark mode override. Hover states (`hover:border-navy/30`, `group-hover:*`) need explicit dark mode overrides too — Tailwind generates separate classes that the variable remapping doesn't cover.

When the toggle fires in `profile-form.tsx`, it:
1. Immediately calls `document.documentElement.classList.toggle()` for instant visual feedback
2. Sends only the changed field to `updatePreferencesAction` (partial update — avoids race conditions from combined writes)

### Discord Integration

`lib/discord/notify.ts` contains two functions:
- `notifyNewEvent()` — posts event embed to `DISCORD_WEBHOOK_URL`
- `notifySuggestion()` — posts suggestion embed to `DISCORD_SUGGESTIONS_WEBHOOK_URL`

Both features **self-disable** when their env var is absent: the admin "Post to Discord" button is hidden if `DISCORD_WEBHOOK_URL` is unset (checked server-side in `admin/page.tsx`); the Club Suggestions card is hidden if `DISCORD_SUGGESTIONS_WEBHOOK_URL` is unset (checked in `account/page.tsx`). Never render Discord UI unconditionally.

## Environment Variables

Copy `.env.example` to `.env.local`. Key groups:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — browser-safe
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never expose to client
- `SANITY_API_TOKEN` — server-only write access
- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` + `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` — browser-safe
- `DISCORD_WEBHOOK_URL` — optional; enables "Post to Discord" button on admin events
- `DISCORD_SUGGESTIONS_WEBHOOK_URL` — optional; enables Club Suggestions form on account page

## Git & Release Flow

Trunk-based development: `main` is the single integration branch. There is no `staging` branch.

### Branches
- `feat/*` / `fix/*` / `chore/*` — all development work
- `main` — the trunk. PRs merge here. Auto-deploys to Railway staging and runs staging migrations on every push.

### Day-to-day
Work on a feature branch and open a PR to `main`. Use `/staging-pr` to create it:

```bash
git checkout -b feat/my-feature
# ... do work, commit freely ...
# When ready:
/staging-pr   # opens PR → main; merges deploy to Railway staging
```

### Releasing to production
When `main` (staging environment) looks good, cut a version tag. Use `/release-pr` to do it:

```bash
/release-pr   # determines next version, creates + pushes v* tag
```

Pushing a `v*` tag triggers two things automatically:
1. **Railway** deploys the tagged commit to the production environment
2. **`migrate-prod.yml`** runs Supabase migrations against the production DB

> **One-time Railway setup required:** In the Railway production service settings, set the deployment source to trigger on tags matching `v*` (instead of branch pushes). The staging service should watch the `main` branch.

### GitHub Actions workflows
| File | Trigger | What it does |
|------|---------|--------------|
| `ci.yml` | push to `main`/`feat/**`/`fix/**`/`chore/**`, PR to `main` | Type check, lint, test, build |
| `migrate.yml` | push to `main` | Runs `supabase db push` against staging DB |
| `migrate-prod.yml` | push to tag `v*` | Runs `supabase db push` against production DB |

### Required GitHub secrets
| Secret | Used by |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | Both migrate workflows |
| `SUPABASE_STAGING_PROJECT_REF` | `migrate.yml` |
| `SUPABASE_STAGING_DB_PASSWORD` | `migrate.yml` |
| `SUPABASE_PROJECT_REF` | `migrate-prod.yml` |
| `SUPABASE_DB_PASSWORD` | `migrate-prod.yml` |

### Never
- Push directly to `main` — always use a PR
- Use `--force` on `main`
- Run `supabase db push` against production manually (`migrate-prod.yml` handles it on tag push)

## Build Progress

- [x] Prompt 1 — Project init
- [x] Prompt 2 — Supabase schema + migrations
- [x] Prompt 3 — Auth + invite flow
- [x] Prompt 4 — Reservation system
- [x] Prompt 5 — Sanity CMS
- [x] Prompt 6 — Member dashboard + calendar
- [x] Prompt 8 — Admin panel (dashboard stats, member search/profiles, book-on-behalf, membership request pipeline, intro email)
- [ ] Prompt 7 — Shopify merch store
- [ ] Prompt 9 — CI/CD + testing (Vitest set up; Playwright pending)
- [ ] Prompt 10 — Documentation

### Additional features shipped outside prompts
- **Member directory** — 2-column card grid with badge watermark, club champion plaque (Sanity-backed, scalloped card, Pinyon Script)
- **Membership/tour request flow** — `/contact` hosts the form; `/membership` redirects there. Admin pipeline: pending → intro email sent → contacted → approved/rejected
- **Admin members page** — active members list with inactive collapsed at bottom
- **Phone formatting** — `(###) ###-####` applied to all phone inputs across the app
- **Node.js v22.22.1** — upgraded from v20.7.0; `.nvmrc` updated
- **Green rebrand** — full site rebranded from navy blue to forest green (#004225). CSS variable change covered all Tailwind utilities automatically
- **Forgot password flow** — full PKCE flow: `resetPasswordForEmail` → `/auth/callback` (exchanges code) → `/account/reset-password` (update password). The `/account/reset-password` route is excluded from member auth middleware since it's accessed pre-login
- **Booking detail modal** — members can tap their reservation in the grid to view details (time, duration, guests) and cancel. `BookingDetailModal` component in `components/reservations/`
- **Locations page** — `/location` on the public site with Google Maps static map, "West LA" labeling, `01` numbering to imply future growth
- **30-minute bookings** — allowed in validation/types; DB constraint updated via migration `20260326000000_bookings_allow_30min.sql`
- **Email templates** — all use shared `emailShell()` in `lib/resend/templates/shared.ts`. Always use `bgcolor` HTML attribute alongside CSS `background-color` on `<td>` elements — mobile email clients (Gmail iOS) strip CSS but respect the HTML attribute
- **Dark mode + high contrast** — member preferences stored in DB, applied via inline `<script>` in member layout (no FOUC). CSS overrides in `app/globals.css`. See "Dark Mode & High Contrast" section above.
- **Discord integration (Fescue Bot)** — admin can post events to Discord; members can submit club suggestions. Both features hidden when webhook env vars absent. See "Discord Integration" section above.
- **Change password** — `/account/change-password` page within the member area calls `supabase.auth.updateUser()` directly. The `/forgot-password` route is only for unauthenticated users; logged-in users are redirected away from it by middleware.
- **Booking grid auto-scroll** — `BayGrid` scrolls to the current time slot on mount via `useRef` + `useEffect([date])`
- **Club suggestions** — `submitSuggestionAction` in `account/actions.ts` posts to Discord suggestions webhook. Returns an error to the user if the webhook call fails.

### Email flows
All emails sent from `noreply@mail.fescuegolfclub.com`. Emails that may need a reply include a note directing members to `sean@fescuegolfclub.com`.

| Trigger | Template | Recipients |
|---------|----------|------------|
| Admin invites member | `invite.ts` | New member |
| Member accepts invite | `welcome.ts` | New member |
| Admin marks request as "intro sent" | `intro.ts` | Membership applicant |
| Booking created | `booking-confirmation.ts` | Member who booked |

See `fescue-build-guide.md` for full spec and `docs/` for service setup guides.
