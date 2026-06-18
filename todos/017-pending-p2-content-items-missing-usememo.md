---
status: pending
priority: p3
issue_id: "017"
tags: [code-review, quality, react, performance]
dependencies: []
---

# contentItems array created inline without useMemo

## Problem Statement

In `display-client.tsx`, `contentItems` is built inline in the component body on every render by mapping over `posts` and `events`. Since these props never change after mount, the mapping is wasted work each render. This also matches a known pattern previously flagged in `011-complete-p2-static-arrays-inside-component.md`.

## Findings

- `app/display/display-client.tsx:31–34` — `contentItems` created via spread + map on every render
- The cycling useEffect deps list uses `contentItems.length` (stable), which avoids re-firing, but `currentItem = contentItems[contentIdx]` on line 81 creates a new object reference each render
- `011-complete-p2-static-arrays-inside-component.md` — same pattern previously fixed elsewhere in the codebase; consistent to apply here too

## Proposed Solutions

### Option 1: Wrap in useMemo

```tsx
const contentItems = useMemo<DisplayContentItem[]>(
  () => [
    ...posts.map((p): DisplayContentItem => ({ kind: 'post', data: p })),
    ...events.map((e): DisplayContentItem => ({ kind: 'event', data: e })),
  ],
  [posts, events],
)
```

**Pros:** Consistent with codebase pattern, correct deps, no wasted work
**Cons:** Minor boilerplate
**Effort:** 5 minutes
**Risk:** None

## Recommended Action

Option 1.

## Technical Details

- **Affected file:** `app/display/display-client.tsx:31–34`
- Add `useMemo` to the existing `useState, useEffect, useCallback` import

## Acceptance Criteria

- [ ] `contentItems` wrapped in `useMemo` with `[posts, events]` deps
- [ ] Cycling behaviour unchanged

## Work Log

- 2026-06-11: Identified during code review of PR #99. Known pattern per todo 011.

## Resources

- PR #99: feat: club kiosk display for wall-mounted monitor
- `todos/011-complete-p2-static-arrays-inside-component.md`
