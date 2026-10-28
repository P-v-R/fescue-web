# Incident: production database unresponsive (Disk IO budget exhausted)

**Date:** 2026-10-28
**Project:** `fescue-production` (`rtyqcmlvrqsxoylztjza`, us-east-2)
**Status:** 🟡 mitigated — DB back up at 12:34pm PT after restart; compute still Nano (see fix list)

## Impact

- Members could not log in: sign-in requests hung ~35–38s then failed
  (`TypeError: Load failed` on iPhone, Sentry issue FESCUE-WEB-F)
- Bookings, reservations page, dashboard and the bay kiosk failed or hung
- Supabase API returned 5xx for ~90–100% of requests from ~11am PT

## Timeline (Pacific)

| Time | Event |
|------|-------|
| 12:06am | Supabase email: "fescue-production is running out of Disk IO Budget" |
| ~10:00am | `bookings` queries jump from ~0.6s to 50–70s avg; first 504s on sign-in |
| 10–11am | 48 of 210 Supabase API requests fail (5xx) |
| 11am–noon | 122 of 122 requests fail |
| noon–1pm | 133 of 147 requests fail; trivial system queries (`pg_settings`) take 15–18s; new DB connections time out |
| ~1pm | Owner reports login timing out; project restarted from dashboard |
| +8 min | Project still in `RESTARTING`; DB not accepting connections (restart slowed by throttled disk) |
| ~12:30pm | Org upgraded Free → Pro ($25/mo). Note: plan upgrade does **not** change compute size |
| 12:34pm | Postgres back up (`ACTIVE_HEALTHY`); queries instant, members signing in successfully |

## Root cause

The project used up its **Disk IO budget**. Once exhausted, Supabase throttles
disk to the compute tier's baseline, so every query that touches disk crawls,
connections back up, and Auth (which also needs the DB) times out.

Traffic was **normal** (~120 requests/hr, mostly the kiosk), and the whole
database is only **18 MB** — it fits in memory, so table scans can't explain the
IO. The project was on the **Free plan's Nano compute** (shared CPU, up to 0.5 GB
RAM shared by Postgres and all Supabase services, smallest IO budget). Most likely
cause: memory pressure on Nano → swapping → swap IO drains the Disk IO budget.
Confirm in Reports → Database (memory/swap, Disk IO % consumed) before/after.

## Evidence

- Sentry trace `cfadcb659278498392958a96ed6227a9`: 3 × `POST /auth/v1/token` → 504 after 35–38s
- Sentry: `GET /rest/v1/bookings` avg 0.6s/hr all day → 51s, 72s, 63s from 17:00 UTC
- Supabase edge logs: 0 5xx before 17:00 UTC, then 48 → 122 → 133/hr
- Supabase postgres logs: `SELECT setting FROM pg_settings WHERE name = 'max_connections'` took 15,010ms
- No deploys or migrations since 2026-10-06

## Prevention — fix list

Legend: ✅ confirmed problem · 🔍 to verify · 💡 hardening

### Database / infrastructure

- [ ] ✅ **Upgrade compute Nano → Micro** (Project Settings → Compute and Disk). The Pro plan upgrade does *not* do this automatically; Nano on a paid org is billed at the Micro price anyway, and the $10/mo compute credit covers Micro. ~2 min downtime — do it in a quiet window
- [ ] 🔍 After a day on Micro, check Reports → Database → "Disk IO % consumed" stays near 0%; if not, consider Small
- [ ] 🔍 **Find what's consuming disk IO** — `pg_stat_statements` top queries by `shared_blks_read`, table/index sizes, bloat
- [ ] 💡 **No index on `bookings(start_time)`** — the kiosk queries bookings by `start_time` every 30s. Only the GiST exclusion constraint exists. *Downgraded from ✅:* the whole DB is 18 MB, so this was not the cause of the IO exhaustion; still cheap and worth adding as the table grows
- [ ] 🔍 Check indexes for other hot filters: `bookings(member_id)`, `blackout_periods(date)`, `members` lookups in middleware
- [ ] 💡 **Set up Disk IO alerts to reach someone who acts** — the 12:06am warning email arrived ~10 hours before the outage; route Supabase alerts to a monitored inbox / Discord
- [ ] 💡 Review Supabase Reports → Database (CPU, memory, Disk IO %) weekly until stable

### App — kiosk

- [x] ✅ **Kiosk polls pile up when the DB is slow** *(fix/login-and-kiosk-resilience)* — `display-client.tsx` fires 2 requests every 30s regardless of whether the previous ones finished. With 60s+ queries, requests stack up and add load exactly when the DB is struggling. Skip a poll while one is in flight; back off on errors
- [ ] 💡 Consider a longer kiosk poll interval (60s) or Supabase Realtime instead of polling

### App — login & error handling

- [x] ✅ **Login form gives no feedback on failure** *(fix/login-and-kiosk-resilience)* — `login-form.tsx` `onSubmit` has no try/catch, so a network failure becomes an unhandled rejection and the user sees nothing (Sentry FESCUE-WEB-F, 19 events / 4 users since May). Catch errors, show "Sign-in is taking longer than usual — try again", add a client-side timeout (~15s)
- [ ] 💡 Middleware (`proxy.ts`) calls Supabase on every request — confirm it fails fast rather than hanging page loads when Supabase is degraded

- [x] ✅ **Outages showed as "Invalid email or password"** — the login action mapped every Supabase error (including 504s) to the wrong-password message, sending members to reset working passwords. Now: 5xx/timeouts → "temporarily unavailable", 429 → "too many attempts" *(fix/login-and-kiosk-resilience)*

### Monitoring

- [ ] 💡 Sentry alert on spikes of Supabase `http.client` span errors / `deadline_exceeded`
- [ ] 💡 Uptime check that exercises the DB (not just a static page) — e.g. a lightweight health route that runs one query

### Housekeeping (found during investigation, unrelated to outage)

- [x] Local `.env.local` Supabase project `vfghypdg…` (staging) was paused — resumed 2026-10-28
- [ ] PR #110 (blackout timezone + kiosk blackouts) still open — merge after the DB is healthy
