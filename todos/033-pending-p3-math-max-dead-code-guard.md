---
status: pending
priority: p3
issue_id: "033"
tags: [code-review, display, simplicity]
dependencies: []
---

# `Math.max(contentItems.length, 1)` guard in cycling effect is dead code

## Problem Statement

In `display-client.tsx`, the cycling effect has:
```ts
const nextIdx = (contentIdx + 1) % Math.max(contentItems.length, 1)
```

The `Math.max(..., 1)` guard prevents division-by-zero, but this branch (`else`, meaning `phase === 'content'`) is only reachable when `contentItems.length > 0` — the `if (phase === 'bays')` branch on the preceding line blocks entry into content phase when the array is empty. The guard is unreachable defensive code that adds visual noise.

## Findings

- `app/display/display-client.tsx:74` — `Math.max(contentItems.length, 1)` guard

## Proposed Solutions

### Option 1: Remove the guard

```ts
const nextIdx = (contentIdx + 1) % contentItems.length
```

**Effort:** Trivial
**Risk:** None — the guard is unreachable

## Recommended Action

Option 1.

## Acceptance Criteria

- [ ] `Math.max` guard removed from cycling effect
- [ ] All existing tests pass

## Work Log

- 2026-06-18: Identified during code review of PR #100 by code-simplicity-reviewer agent.
