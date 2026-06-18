---
status: pending
priority: p3
issue_id: "031"
tags: [code-review, display, performance]
dependencies: []
---

# `clockStr` and `dateStr` recomputed on every render including poll-driven re-renders

## Problem Statement

`BayStatusView` recomputes `clockStr` and `dateStr` on every render:
```ts
const clockStr = now.toLocaleTimeString('en-US', { ... })
const dateStr = now.toLocaleDateString('en-US', { ... })
```

`toLocaleTimeString` constructs a new `Intl.DateTimeFormat` object internally on each call. The component re-renders when `bookings` changes (every 30s from parent poll), even though `now` hasn't changed. Wrapping in `useMemo([now])` prevents the recomputation on poll-driven renders.

## Findings

- `app/display/bay-status-view.tsx:29-37` — not memoized

## Proposed Solutions

### Option 1: Wrap in `useMemo`

```ts
const clockStr = useMemo(
  () => now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  [now],
)
const dateStr = useMemo(
  () => now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  [now],
)
```

**Effort:** Trivial
**Risk:** None

## Recommended Action

Option 1.

## Acceptance Criteria

- [ ] `clockStr` and `dateStr` wrapped in `useMemo([now])`

## Work Log

- 2026-06-18: Identified during code review of PR #100 by performance-oracle agent.
