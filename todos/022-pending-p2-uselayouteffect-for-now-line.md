---
status: pending
priority: p2
issue_id: "022"
tags: [code-review, display, performance, visual]
dependencies: []
---

# `useEffect` for NOW line DOM measurement causes two-paint flicker

## Problem Statement

The floating gold NOW line position is computed by reading DOM measurements (`clientHeight`) in a `useEffect`. `useEffect` fires after the browser has already painted, so the sequence is: render → paint (line at old position) → effect reads DOM → `setNowLineTop` → re-render → paint (line at correct position). This produces a visible single-frame glitch every 60 seconds on the wall display. `useLayoutEffect` fires synchronously after DOM mutation but before paint, eliminating the intermediate paint.

## Findings

- `app/display/bay-status-view.tsx:85` — `useEffect` used for DOM measurement
- The `// eslint-disable-next-line react-hooks/set-state-in-effect` comment on line 89 suggests this was noticed but not properly resolved
- `BayStatusView` is already `'use client'` so `useLayoutEffect` is safe (no SSR concern)

## Proposed Solutions

### Option 1: Replace `useEffect` with `useLayoutEffect` for the measurement block

```tsx
// Change only the DOM measurement effect; keep the clock interval as useEffect
useLayoutEffect(() => {
  const grid = gridRef.current
  const thead = theadRef.current
  if (!grid || !thead || nowSlotIdx < 0) {
    setNowLineTop(null)
    return
  }
  const theadHeight = thead.clientHeight
  const tbodyHeight = grid.clientHeight - theadHeight
  const rowHeight = tbodyHeight / slots.length
  const minutesFraction = (now.getMinutes() % 30) / 30
  setNowLineTop(theadHeight + (nowSlotIdx + minutesFraction) * rowHeight)
}, [now, nowSlotIdx, slots.length])
```

Also remove the spurious `// eslint-disable-next-line react-hooks/set-state-in-effect` comment — the rule `react-hooks/set-state-in-effect` does not exist; the comment suppresses nothing.

**Pros:** Eliminates flicker, correct React pattern for DOM measurement
**Cons:** None — `useLayoutEffect` is the documented solution for this pattern
**Effort:** Tiny
**Risk:** None

## Recommended Action

Option 1.

## Technical Details

- **Affected file:** `app/display/bay-status-view.tsx:85-97`
- Import: add `useLayoutEffect` to the react import; `useEffect` is still needed for the clock interval

## Acceptance Criteria

- [ ] DOM measurement effect uses `useLayoutEffect`
- [ ] Clock interval effect remains `useEffect`
- [ ] Spurious eslint-disable comment on line 89 removed
- [ ] NOW line renders at correct position without visible flicker

## Work Log

- 2026-06-18: Identified during code review of PR #100 by performance-oracle and kieran-typescript-reviewer agents.

## Resources

- PR #100: feat(display): light-mode tee-sheet kiosk with tests
- React docs: https://react.dev/reference/react/useLayoutEffect
