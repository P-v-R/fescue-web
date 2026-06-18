---
status: pending
priority: p1
issue_id: "020"
tags: [code-review, resilience, display]
dependencies: []
---

# `DisplayErrorBoundary` has no auto-recovery — permanent blank screen on render error

## Problem Statement

The `DisplayErrorBoundary` component (added in a previous fix for todo 016) catches render errors and shows a `—` fallback, but has no `componentDidCatch` that schedules a reload. On a 24/7 wall-mounted kiosk with no one watching overnight, a single transient render error (malformed booking payload, Sanity shape change) will leave the display permanently dark until someone physically intervenes. There is no escalation or recovery mechanism.

## Findings

- `app/display/display-error-boundary.tsx` — `getDerivedStateFromError` sets error state but `componentDidCatch` is absent
- The boundary correctly prevents the blank white React crash page, but the `—` fallback is equally useless for a wall display

## Proposed Solutions

### Option 1: Auto-reload after 5 seconds (recommended)

```tsx
componentDidCatch(error: Error) {
  console.error('[DisplayErrorBoundary] render error — reloading in 5s', error)
  setTimeout(() => window.location.reload(), 5_000)
}
```

Logs to Railway for visibility, then reloads the page to clear transient state.

**Pros:** Standard kiosk resilience pattern, simple, self-healing
**Cons:** Permanent bugs would cause a reload loop (5s of dark screen, then reload, repeat)
**Effort:** Tiny
**Risk:** None for transient errors; acceptable for permanent ones (loop is visible and easy to diagnose)

### Option 2: Exponential backoff reload

Increase delay on successive errors: 5s → 30s → 5min → give up.

**Pros:** Avoids reload loop for permanent bugs
**Cons:** More complex; for this kiosk context, loop visibility is actually useful
**Effort:** Small
**Risk:** Low

## Recommended Action

Option 1 for now. The kiosk is a single known device; a reload loop is immediately visible and alertable.

## Technical Details

- **Affected file:** `app/display/display-error-boundary.tsx`

## Acceptance Criteria

- [ ] `componentDidCatch` added with `console.error` + `setTimeout(reload, 5000)`
- [ ] Error message includes component name for log searchability
- [ ] Existing fallback UI unchanged

## Work Log

- 2026-06-18: Identified during code review of PR #100 by performance-oracle agent. Note: todo 016 (adding the boundary) is complete; this is a follow-up about recovery within the boundary.

## Resources

- PR #100: feat(display): light-mode tee-sheet kiosk with tests
- `todos/016-complete-p2-no-error-boundary-on-display.md`
