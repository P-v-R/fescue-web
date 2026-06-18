---
status: pending
priority: p3
issue_id: "034"
tags: [code-review, display, simplicity]
dependencies: []
---

# Redundant `<div className='h-full'>` wrapper around `<BayStatusView>` in display-client

## Problem Statement

`display-client.tsx` wraps `BayStatusView` in an extra div:
```tsx
<div className='h-full'>
  <BayStatusView bays={bays} bookings={bookings} />
</div>
```

`BayStatusView` already renders `<div className='flex flex-col h-full'>` as its root element, and its parent (`div.h-full.transition-opacity`) already provides full-height context. The outer `h-full` wrapper is redundant.

## Findings

- `app/display/display-client.tsx:108-110` — redundant wrapper div

## Proposed Solutions

### Option 1: Remove the wrapper

```tsx
{phase === 'bays' ? (
  <BayStatusView bays={bays} bookings={bookings} />
) : currentItem ? (
  <ContentSlide item={currentItem} />
) : null}
```

**Effort:** Trivial
**Risk:** None — verify visually that layout is unchanged

## Recommended Action

Option 1.

## Acceptance Criteria

- [ ] Wrapper div removed
- [ ] Visual layout identical to before

## Work Log

- 2026-06-18: Identified during code review of PR #100 by code-simplicity-reviewer agent.
