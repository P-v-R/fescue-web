---
status: pending
priority: p2
issue_id: "021"
tags: [code-review, display, correctness]
dependencies: []
---

# Posts and events not refreshed after page load — stale content on day rollover

## Problem Statement

`bays`, `posts`, and `events` are loaded once at SSR time in `app/display/page.tsx` and passed as props to `DisplayClient`. Bookings are polled every 30 seconds (correct), but content from Sanity (bulletin posts) and Supabase `events` are never refreshed. On a kiosk running 24/7, content loaded Monday morning is still being shown on Tuesday — new posts published during the day never appear, and past events are never removed from rotation.

## Findings

- `app/display/page.tsx:34-38` — `posts` and `events` fetched once at SSR
- `app/display/display-client.tsx:13-15` — props `posts` and `events` are never re-fetched
- The polling endpoint `/api/display/bookings` only returns bookings, not content

## Proposed Solutions

### Option 1: Daily full-page reload in `DisplayClient` (recommended, simplest)

```tsx
useEffect(() => {
  // Reload once per day to pick up new content from Sanity and events table
  const msUntilMidnight = new Date().setHours(24, 5, 0, 0) - Date.now() // 12:05 AM
  const timer = setTimeout(() => window.location.reload(), msUntilMidnight)
  return () => clearTimeout(timer)
}, [])
```

**Pros:** Trivially simple, guaranteed fresh content each day, also resets any accumulated React state
**Cons:** 5-second dark screen at midnight
**Effort:** Tiny
**Risk:** None

### Option 2: Extend polling endpoint to return posts and events

Add `posts` and `events` to the `/api/display/bookings` response; poll and update state.

**Pros:** Content updates within 30 seconds without a reload
**Cons:** Significantly more complex; requires Sanity query in a Next.js route handler
**Effort:** Medium
**Risk:** Low

## Recommended Action

Option 1. The midnight-reload approach is the industry standard for kiosk displays and requires ~5 lines.

## Technical Details

- **Affected file:** `app/display/display-client.tsx`

## Acceptance Criteria

- [ ] `DisplayClient` schedules a `window.location.reload()` at a fixed time each day (e.g., 12:05 AM)
- [ ] Timer is cleaned up in `useEffect` return
- [ ] New posts published during the day appear after midnight reload

## Work Log

- 2026-06-18: Identified during code review of PR #100 by performance-oracle agent.

## Resources

- PR #100: feat(display): light-mode tee-sheet kiosk with tests
