---
status: pending
priority: p3
issue_id: "030"
tags: [code-review, display, react]
dependencies: []
---

# `<tr key={slotIdx}>` uses array index — prefer stable time-based key

## Problem Statement

`bay-status-view.tsx` uses `slotIdx` as the React key for table rows. When the slots array changes length (near closing time as the window shrinks), index-based keys can cause incorrect reconciliation. A stable key based on the slot's timestamp is trivially available.

## Findings

- `app/display/bay-status-view.tsx:183` — `<tr key={slotIdx} ...>`

## Proposed Solutions

### Option 1: Use `slotTime.getTime()` as key

```tsx
<tr key={slotTime.getTime()} style={{ height: `${100 / slots.length}%` }}>
```

**Effort:** Trivial
**Risk:** None

## Recommended Action

Option 1.

## Acceptance Criteria

- [ ] `<tr>` key uses `slotTime.getTime()` instead of array index

## Work Log

- 2026-06-18: Identified during code review of PR #100 by kieran-typescript-reviewer agent.
