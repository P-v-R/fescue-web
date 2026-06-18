---
status: pending
priority: p3
issue_id: "036"
tags: [code-review, display, error-handling]
dependencies: []
---

# No try/catch in `/api/display/bookings` route — Supabase error yields unhandled 500

## Problem Statement

`app/api/display/bookings/route.ts` calls `getDisplayBookingsForToday()` with no error handling. If Supabase is temporarily unavailable, the route throws and Next.js returns a 500 with no body. The client (`display-client.tsx`) already handles non-`ok` responses gracefully (keeps stale data), so impact is low — but the route should return a typed JSON error response to match the project convention and to avoid noisy 500s in Railway logs.

## Findings

- `app/api/display/bookings/route.ts:11` — `const bookings = await getDisplayBookingsForToday()` with no try/catch

## Proposed Solutions

### Option 1: Wrap in try/catch, return JSON error on failure

```ts
try {
  const bookings = await getDisplayBookingsForToday()
  return NextResponse.json(bookings)
} catch {
  return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
}
```

**Effort:** Trivial
**Risk:** None

## Recommended Action

Option 1.

## Acceptance Criteria

- [ ] try/catch added around Supabase query
- [ ] Error returns JSON `{ error: string }` with 500 status
- [ ] Client behaviour unchanged (already handles non-ok)

## Work Log

- 2026-06-18: Identified during code review of PR #100 by kieran-typescript-reviewer agent.
