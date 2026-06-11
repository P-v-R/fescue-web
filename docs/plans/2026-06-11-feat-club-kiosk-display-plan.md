---
title: "feat: Club Kiosk Display"
type: feat
status: completed
date: 2026-06-11
---

# Club Kiosk Display

## Overview

A wall-mounted monitor display driven by a Raspberry Pi running a browser in kiosk mode. The page lives at `/display?token=<secret>` and continuously loops between a bay occupancy view and content slides (bulletin posts + upcoming events). No auth, no session management — the Pi loads the URL once and never needs to log in.

## Proposed Solution

New `app/display/` route (outside all route groups — uses root layout only, no nav). Server component validates the token, fetches initial data, then hands off to a client component that manages the cycling loop and a Supabase realtime subscription.

**Loop:** Bays (60 s) → Content slide N (15 s) → Bays (60 s) → Content slide N+1 (15 s) → repeat, wrapping content index.

## Technical Considerations

- **Token auth**: `DISPLAY_TOKEN` env var, checked server-side in `page.tsx`. Missing or wrong token renders a minimal 403 message — nothing else.
- **Middleware**: No changes needed. `/display` is not in any of `MEMBER_ROUTES`, `ADMIN_ROUTES`, `AUTH_ROUTES`, or `MARKETING_ROUTES` in `proxy.ts`, so it passes through untouched for both authed and unauthed visitors.
- **Realtime**: Same pattern as `reservations-client.tsx` — `createClient()` (browser client), subscribe to `postgres_changes` on `bookings`, re-fetch today's bookings on any event.
- **Data fetch for display**: Uses the admin client (`createAdminClient`) server-side in `page.tsx` — bypasses RLS so no auth session is needed.
- **Bay status logic**: For each active bay, derive `current` (booking whose `start_time <= now < end_time`) and `next` (first booking where `start_time > now`). Show first name only.
- **Content**: Flatten `[...bulletinPosts, ...upcomingEvents]` into one array. Bulletin posts show title + plain-text excerpt; events show title + formatted date + optional location.
- **No new Sanity types**: Reuse `getBulletinPosts()` and `getAllUpcomingEvents()` (Supabase).
- **Transitions**: CSS `transition-opacity duration-700` toggled via state — fade between views.
- **Cache**: `export const dynamic = 'force-dynamic'` on `page.tsx` — always fetches fresh data on initial load.

## Files to Create / Modify

### New files

| File | Purpose |
|------|---------|
| `app/display/page.tsx` | Server component — token check, data fetch, renders `DisplayClient` |
| `app/display/display-client.tsx` | Client component — cycling loop, realtime subscription, phase state |
| `app/display/bay-status-view.tsx` | Renders current/next booking per bay in a large-format grid |
| `app/display/content-slide.tsx` | Renders a single bulletin post or event slide |
| `lib/supabase/queries/display.ts` | `getDisplayBookingsForToday()` — admin client query, no auth |

### Modified files

| File | Change |
|------|--------|
| `.env.example` | Add `DISPLAY_TOKEN=` with comment |

## Implementation Details

### `app/display/page.tsx`
```tsx
// Server Component
export const dynamic = 'force-dynamic'

export default async function DisplayPage({ searchParams }) {
  const token = (await searchParams).token
  if (!process.env.DISPLAY_TOKEN || token !== process.env.DISPLAY_TOKEN) {
    return <div className="...">403</div>
  }

  const [bays, bookings, posts, events] = await Promise.all([
    getActiveBays(),           // existing admin query or inline
    getDisplayBookingsForToday(),  // new query in lib/supabase/queries/display.ts
    getBulletinPosts(),        // existing Sanity query
    getAllUpcomingEvents(),     // existing Supabase query
  ])

  return <DisplayClient bays={bays} initialBookings={bookings} posts={posts} events={events} />
}
```

### `lib/supabase/queries/display.ts`
```ts
// Uses admin client — no RLS, no auth required
export async function getDisplayBookingsForToday(): Promise<BookingWithMember[]> {
  const supabase = createAdminClient()
  // same .select('*, members(full_name)') pattern as getBookingsForDate
  // filter: today's date range, cancelled_at is null
}
```

### `app/display/display-client.tsx`
```tsx
'use client'
// State: phase ('bays' | 'content'), contentIdx, bookings, visible (for fade)
// useEffect #1: cycling timer
//   - if phase === 'bays': setTimeout 60000 → set visible=false, then 700ms later set phase='content', visible=true
//   - if phase === 'content': setTimeout 15000 → set visible=false, then 700ms later
//       advance contentIdx (wrap), set phase='bays', visible=true
// useEffect #2: Supabase realtime — same channel pattern as reservations-client.tsx
//   subscribe to bookings, re-fetch with getDisplayBookingsForToday on any change
// Render: full-screen dark bg, conditional render of BayStatusView or ContentSlide
```

### `app/display/bay-status-view.tsx`
```tsx
// Props: bays, bookings (today's, realtime-updated)
// For each bay:
//   current = bookings.find(b => new Date(b.start_time) <= now && now < new Date(b.end_time))
//   next    = bookings.find(b => new Date(b.start_time) > now)  // first one (sorted asc)
// Layout: CSS grid with one column per bay
// Large bay name label, member first name, greyed if both slots empty
```

### `app/display/content-slide.tsx`
```tsx
// Props: item (BulletinPost | Event) with a discriminant field
// Bulletin post: show title prominently, plain-text body excerpt (strip Portable Text blocks to strings)
// Event: show title, formatted starts_at date/time, optional location
// Full-screen centered layout, Fescue branding (navy bg, cream text, gold accent)
```

## Acceptance Criteria

- [x] `/display?token=correct` renders the kiosk display; any other token value (or missing) renders a blank 403
- [x] Bay status view shows each active bay with current member first name and next member first name; empty slots are greyed/blank (no "Available" text)
- [x] Content cycles: 60 s on bays → 15 s per content slide → back to bays → next slide → etc.
- [x] Content slides interleave all active bulletin posts and all upcoming events
- [x] Display auto-updates when a booking is created or cancelled (Supabase realtime)
- [x] No nav bar, footer, or member chrome — full screen, designed for a wall monitor
- [x] `DISPLAY_TOKEN` added to `.env.example`
- [x] Works on Raspberry Pi Chromium in kiosk mode (`--kiosk --noerrdialogs --disable-infobars`)

## Dependencies & Risks

- **Supabase realtime must be enabled** for the `bookings` table (Database → Replication). Already required by the existing reservations grid — should already be on.
- **`DISPLAY_TOKEN` must be set** in Railway env vars (both staging and production). If unset, the page shows 403 — display goes blank, not a crash.
- **Portable Text → plain text**: `BulletinPost.body` is `PortableTextBlock[] | null`. For the kiosk, extract text by mapping `block.children[].text` — no need for `@portabletext/react`.
- **Events from Supabase** (`getAllUpcomingEvents`), not Sanity. Already exists; no new query needed.
- **Root layout compatibility**: `app/layout.tsx` must not inject nav/header automatically. Verify before implementing — may need a minimal `app/display/layout.tsx` that overrides with `<html><body>{children}</body></html>` if the root layout adds chrome.

## References

- Realtime pattern: `app/(member)/reservations/reservations-client.tsx:96-111`
- Admin client query pattern: `lib/supabase/queries/bookings.ts:12-26`
- Sanity bulletin query: `lib/sanity/queries.ts:6-26`
- Events query: `lib/supabase/queries/events.ts`
- Middleware route lists: `proxy.ts:5-8`
- Design tokens: `app/globals.css` (`--navy`, `--cream`, `--gold`, `--sage`, Playfair Display + DM Mono)
- Brainstorm: `docs/brainstorms/2026-06-11-club-display-brainstorm.md`
