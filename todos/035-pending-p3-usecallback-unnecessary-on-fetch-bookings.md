---
status: pending
priority: p3
issue_id: "035"
tags: [code-review, display, simplicity, react]
dependencies: []
---

# `useCallback` on `fetchBookings` is unnecessary — function only used inside `useEffect`

## Problem Statement

`display-client.tsx` wraps `fetchBookings` in `useCallback`:
```ts
const fetchBookings = useCallback(async () => { ... }, [token])
```

`useCallback` is useful when a function is passed as a prop to child components or used in other hooks that depend on reference stability. Here, `fetchBookings` is only used inside a single `useEffect` on the next line. Inlining the function into the effect (or referencing a plain function defined inside) removes an unnecessary abstraction and the `useCallback` import.

## Findings

- `app/display/display-client.tsx:39-50` — `useCallback` with single useEffect consumer

## Proposed Solutions

### Option 1: Inline the fetch into the effect

```ts
useEffect(() => {
  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/display/bookings', { headers: { Authorization: token } })
      if (!res.ok) return
      const data = await res.json()
      setBookings(data as BookingWithMember[])
    } catch {
      // silently ignore — keep showing stale data
    }
  }
  const interval = setInterval(fetchBookings, POLL_INTERVAL)
  return () => clearInterval(interval)
}, [token])
```

**Pros:** Removes `useCallback`, two separate effects merged into one, `token` dep is direct
**Cons:** None
**Effort:** Tiny
**Risk:** None — behaviour identical

## Recommended Action

Option 1.

## Acceptance Criteria

- [ ] `useCallback` removed
- [ ] `useCallback` import removed if no longer used
- [ ] Polling behaviour unchanged

## Work Log

- 2026-06-18: Identified during code review of PR #100 by code-simplicity-reviewer agent.
