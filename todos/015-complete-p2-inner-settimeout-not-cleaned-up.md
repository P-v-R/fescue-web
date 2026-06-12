---
status: pending
priority: p2
issue_id: "015"
tags: [code-review, quality, react]
dependencies: []
---

# Inner setTimeout not cleaned up in cycling loop

## Problem Statement

In `display-client.tsx`, the cycling useEffect cleans up the outer `setTimeout` on teardown, but the inner `setTimeout` (for the fade-in after state advance) is never cancelled. If the component re-renders or unmounts while the fade is mid-flight, the inner timer fires and calls `setVisible(true)` on a stale closure, potentially causing a flicker or (in dev strict mode) a state update on an unmounted component.

For a kiosk that never unmounts this is low risk day-to-day, but strict mode double-invocation in development will reliably trigger it, and any future navigation away from the page would leak the timer.

## Findings

- `app/display/display-client.tsx:58–76` — outer timer is returned for cleanup, inner is not
- The inner timer runs after `FADE_DURATION` (700ms) and calls `setPhase`, `setContentIdx`, `setVisible` — all state setters from the closed-over scope
- React 18 suppresses the "can't call setState on unmounted component" error but the state update still executes
- Dev strict mode double-invokes effects, which reliably triggers this: first effect fires outer timer → cleans up → second effect fires → inner timer from first effect still pending

## Proposed Solutions

### Option 1: Track and cancel the inner timer with a ref

**Approach:** Store the inner timer ID in a `useRef` and cancel it in the cleanup function alongside the outer timer.

```tsx
const innerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

useEffect(() => {
  const duration = phase === 'bays' ? BAYS_DURATION : CONTENT_DURATION

  const timer = setTimeout(() => {
    setVisible(false)
    innerTimerRef.current = setTimeout(() => {
      // advance state...
      setVisible(true)
    }, FADE_DURATION)
  }, duration)

  return () => {
    clearTimeout(timer)
    if (innerTimerRef.current) clearTimeout(innerTimerRef.current)
  }
}, [phase, contentIdx, contentItems.length])
```

**Pros:** Correct, no leaks, works in strict mode
**Cons:** Adds a ref
**Effort:** 15 minutes
**Risk:** Low

---

### Option 2: Flatten into a single timer with longer duration

**Approach:** Remove the nested timer entirely. Advance state immediately on the outer timer, and let the CSS transition handle the visual fade without needing to defer state.

This only works if the fade-out is purely cosmetic — which it is; `setVisible(false)` triggers a CSS opacity transition, and `setVisible(true)` after the state change creates the fade-in. If we accept that the content swap happens instantly (under the fade-out cover), we can:

1. Outer timer fires → start fade-out animation via CSS class
2. Use `onTransitionEnd` on the container div to advance state and fade back in

**Pros:** No nested timers at all, event-driven rather than time-driven
**Cons:** Couples animation to DOM events, slightly more complex event handling
**Effort:** 30 minutes
**Risk:** Low-Medium

## Recommended Action

Option 1 — straightforward fix, minimal change.

## Technical Details

- **Affected file:** `app/display/display-client.tsx:55–79`
- **Component:** `DisplayClient`

## Acceptance Criteria

- [ ] Both timers (outer and inner) are cancelled in the useEffect cleanup
- [ ] No state update warnings in React dev strict mode
- [ ] Fade/cycle behaviour unchanged

## Work Log

- 2026-06-11: Identified during code review of PR #99 (feat/club-kiosk-display)

## Resources

- PR #99: feat: club kiosk display for wall-mounted monitor
