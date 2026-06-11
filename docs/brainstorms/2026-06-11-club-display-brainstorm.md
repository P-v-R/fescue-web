---
date: 2026-06-11
topic: club-display
---

# Club Kiosk Display

## What We're Building

A wall-mounted monitor display (driven by a Raspberry Pi running a browser in kiosk mode) that loops through two views:

1. **Bay Reservations** (1 minute) — shows current and next booking per bay, minimal and readable from across the room
2. **Announcements/Events** (15 seconds each) — cycles through Sanity bulletin posts and calendar events

The loop runs continuously during business hours. The page is publicly accessible via a secret token in the URL (`/display?token=...`). No auth, no session management needed on the Pi.

## Why This Approach

- No new content types — reuses existing Sanity bulletin posts and events the owner already manages
- Static token in env var — simple, set once on the Pi, never needs rotation
- Hosted on the existing Next.js site — no separate infrastructure
- Real-time reservations data via Supabase (same source as the member-facing bay grid)

## Key Decisions

- **Auth**: Secret static token in `DISPLAY_TOKEN` env var, checked server-side. No login flow.
- **Reservations view**: Current booking + next booking per bay only (not full timeline)
- **Content cycling**: 1 min reservations → 15 sec per announcement/event → repeat
- **Content source**: Sanity bulletin posts + Sanity events (no new CMS types)
- **Realtime**: Supabase realtime subscription for reservations (same pattern as bay grid)

## Open Questions Resolved

- **Empty bays**: shown blank/greyed out (no "Available" label)
- **Business hours**: display runs whenever the Pi is powered on — no time gating
- **Content volume**: cycle through all active bulletin posts (no fixed cap)

## Next Steps

→ `/workflows:plan` for implementation details
