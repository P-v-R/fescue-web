---
status: pending
priority: p2
issue_id: "016"
tags: [code-review, quality, resilience]
dependencies: []
---

# No error boundary on kiosk display — crash = blank screen

## Problem Statement

The display page runs unattended on a wall monitor 8+ hours a day. If any component throws a runtime error (e.g., malformed booking data, a null dereference in `getBayStatus`, or an unexpected Portable Text block structure), React will unmount the entire tree and the screen goes blank. Since nobody is actively watching the code, the kiosk stays blank until someone notices and manually restarts the Pi or refreshes the page.

An error boundary around the display would catch the error and show a graceful fallback (e.g., "—" or the last known state), keeping the display useful even when something goes wrong.

## Findings

- `app/display/display-client.tsx` — no error boundary wrapping `BayStatusView` or `ContentSlide`
- `app/display/bay-status-view.tsx:70` — `getBayStatus` accesses `new Date(b.start_time)` and `new Date(b.end_time)` without validation; a null/invalid timestamp would throw
- `app/display/content-slide.tsx:70` — `new Date(event.starts_at)` called without null check; if `starts_at` is null, `toLocaleDateString` throws
- The display runs without any human supervision — a blank screen could go unnoticed for hours

## Proposed Solutions

### Option 1: React error boundary component wrapping the main content

**Approach:** Create a simple `DisplayErrorBoundary` class component (required for error boundaries in React) that catches render errors and shows a minimal fallback.

```tsx
// app/display/display-error-boundary.tsx
'use client'
import { Component, type ReactNode } from 'react'

export class DisplayErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div className='fixed inset-0 bg-navy-dark flex items-center justify-center'>
          <p className='font-mono text-xs uppercase tracking-[0.28em] text-white/20'>—</p>
        </div>
      )
    }
    return this.props.children
  }
}
```

Wrap the main content in `display-client.tsx`:
```tsx
<DisplayErrorBoundary>
  {phase === 'bays' ? <BayStatusView ... /> : <ContentSlide ... />}
</DisplayErrorBoundary>
```

**Pros:** Prevents blank screen on any render error, minimal code
**Cons:** Class component boilerplate (required by React for error boundaries)
**Effort:** 20 minutes
**Risk:** Low

---

### Option 2: Defensive null checks in the components + no boundary

**Approach:** Add null/validity guards at each data access point in `bay-status-view.tsx` and `content-slide.tsx` so nothing can throw.

**Pros:** No new component needed
**Cons:** Doesn't protect against unexpected future errors; defensive coding alone can't cover all cases
**Effort:** 30 minutes
**Risk:** Medium (incomplete protection)

## Recommended Action

Option 1 — error boundaries are the right tool for production resilience, especially for always-on displays.

## Technical Details

- **Affected files:** `app/display/display-client.tsx`, new `app/display/display-error-boundary.tsx`

## Acceptance Criteria

- [ ] Render errors in `BayStatusView` or `ContentSlide` show a minimal fallback instead of blank screen
- [ ] Error boundary does not interfere with normal cycling behaviour
- [ ] Fallback is visually consistent with the display aesthetic

## Work Log

- 2026-06-11: Identified during code review of PR #99 (feat/club-kiosk-display)

## Resources

- PR #99: feat: club kiosk display for wall-mounted monitor
