---
status: pending
priority: p2
issue_id: "026"
tags: [code-review, display, simplicity]
dependencies: []
---

# 4-deep nested date-fns calls should use `set()` for readability

## Problem Statement

`lib/utils/display.ts` constructs date objects using four nested date-fns setters:
```ts
const closeTime = setMilliseconds(setSeconds(setMinutes(setHours(new Date(now), CLOSE_HOUR), 0), 0), 0)
const start     = setMilliseconds(setSeconds(setMinutes(setHours(new Date(now), startHour),  0), 0), 0)
```
date-fns v3 provides `set(date, values)` which collapses all four operations into one readable call. The same pattern appears in `lib/utils/time-slots.ts`. Both files import 4–5 individual setters that can be replaced with a single `set` import.

## Findings

- `lib/utils/display.ts:1, 12-19` — 4 imports + 4-deep nesting on 2 lines
- `lib/utils/time-slots.ts` — same pattern repeated

## Proposed Solutions

### Option 1: Replace with `set()` from date-fns

```ts
import { addMinutes, set } from 'date-fns'

const closeTime = set(now, { hours: CLOSE_HOUR, minutes: 0, seconds: 0, milliseconds: 0 })
const start     = set(now, { hours: startHour,  minutes: 0, seconds: 0, milliseconds: 0 })
```

Note: `set()` in date-fns v3 does not mutate the input — no need for `new Date(now)` defensive copy.

Apply the same simplification to `lib/utils/time-slots.ts`.

**Pros:** Dramatically more readable, fewer imports, aligns with date-fns idiomatic usage
**Cons:** None
**Effort:** Small
**Risk:** Low — pure refactor with identical output; covered by existing unit tests

## Recommended Action

Option 1. Verify with `pnpm test` that `display.test.ts` and any time-slots tests still pass.

## Technical Details

- **Affected files:** `lib/utils/display.ts`, `lib/utils/time-slots.ts`
- Confirm date-fns v3 `set()` is available: `import { set } from 'date-fns'`

## Acceptance Criteria

- [ ] `display.ts` uses `set()` instead of 4-deep nesting; 4 individual setter imports removed
- [ ] `time-slots.ts` same simplification applied
- [ ] All existing tests pass unchanged

## Work Log

- 2026-06-18: Identified during code review of PR #100 by code-simplicity-reviewer agent.

## Resources

- PR #100: feat(display): light-mode tee-sheet kiosk with tests
- date-fns `set` docs: https://date-fns.org/docs/set
