# Remaining Work

Prompts 1–8 are complete. The following is left to build.

---

## Prompt 9 — CI/CD + Testing

**GitHub Actions** (`.github/workflows/ci.yml`):
- Trigger on push/PR to `main` and `staging`
- Jobs: `type-check` (tsc --noEmit), `lint` (eslint), `test` (vitest with coverage), `e2e` (playwright)
- `deploy-staging` job on push to `staging` branch → Vercel
- `deploy-production` job on push to `main` branch → Vercel (`--prod`)
- Secrets needed: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, all app env vars

**Vitest** (`vitest.config.ts`):
- Coverage target: 80% on `lib/` directory
- Unit tests in `tests/unit/`:
  - `booking-conflicts.test.ts` — overlap detection logic
  - `invite-expiry.test.ts` — token expiry checking
  - `slot-validation.test.ts` — duration + operating hours edge cases

**Playwright** (`playwright.config.ts`):
- Base URL from env, chromium + mobile safari projects, screenshot on failure
- E2E tests in `tests/e2e/`:
  - `auth.spec.ts` — login, logout, forgot password
  - `invite.spec.ts` — full invite → register → login flow
  - `reservations.spec.ts` — book a bay, see on grid, cancel
  - `admin.spec.ts` — send invite, view members, cancel a booking
  - `shop.spec.ts` — browse products, add to cart, cart drawer

**`package.json` scripts** to add:
```json
"type-check": "tsc --noEmit",
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

---

## Prompt 10 — Documentation

Two files in `/docs/`:

- **`admin-guide.md`** — Non-technical guide for the club owner covering: logging into `/admin`, inviting members, deactivating members, responding to membership requests, using Sanity Studio (`/studio`), creating bulletin posts, adding social events, viewing today's reservations.

- **`developer-guide.md`** — Onboarding guide for developers covering: architecture overview, local dev setup, branch strategy + PR process, safe migration process, adding Sanity content types, adding protected routes, environment variables reference, deployment process, backup policy, testing guide, common gotchas (service role key usage, RLS, Shopify cart cookie, FullCalendar SSR).

---

## Stub Pages (not in build prompts — needs real content)

These pages exist as stubs (`return <div>...</div>`) and need design + content:

| Page | File |
|---|---|
| Landing page | `app/(public)/page.tsx` |
| About | `app/(public)/about/page.tsx` |
| Membership / request form | `app/(public)/membership/page.tsx` |
| Contact | `app/(public)/contact/page.tsx` |

The `/membership` page is the most important — it should include a membership request form that calls `createMembershipRequest()` from `lib/supabase/queries/membership-requests.ts`.

---

## Setup Steps (your action items before going live)

- [ ] Create Supabase project + run migrations (see `docs/supabase-setup.md`)
- [ ] Create Sanity project + get API token (see `docs/sanity-setup.md`)
- [ ] Create Shopify store + get Storefront API token (see `docs/shopify-setup.md`)
- [ ] Get a Resend API key at resend.com + verify your sending domain
- [ ] Set all env vars in Vercel (staging + production)
- [ ] Create your admin user in Supabase (see `docs/supabase-setup.md`)
- [ ] Update `FROM_ADDRESS` in `lib/resend/client.ts` with your real domain
