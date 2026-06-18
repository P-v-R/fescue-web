---
status: pending
priority: p3
issue_id: "029"
tags: [code-review, display, typescript, consistency]
dependencies: []
---

# Date relational comparison uses `<=` on Date objects — should use `.getTime()`

## Problem Statement

`bay-status-view.tsx` uses:
```ts
slots.findIndex((s) => s <= now && now < addMinutes(s, SLOT_MINUTES))
```

TypeScript's `<=` on `Date` objects works at runtime via implicit `.valueOf()` coercion, but it is not idiomatic and inconsistent with the rest of the codebase which uses `.getTime()` for date comparisons. It also does not make the intent explicit.

## Findings

- `app/display/bay-status-view.tsx:40-42` — `s <= now && now < addMinutes(s, SLOT_MINUTES)`

## Proposed Solutions

### Option 1: Use `.getTime()`

```ts
slots.findIndex((s) => s.getTime() <= now.getTime() && now.getTime() < addMinutes(s, SLOT_MINUTES).getTime())
```

**Effort:** Trivial
**Risk:** None

## Recommended Action

Option 1.

## Acceptance Criteria

- [ ] `.getTime()` used for all Date comparisons in `bay-status-view.tsx`

## Work Log

- 2026-06-18: Identified during code review of PR #100 by kieran-typescript-reviewer agent.
