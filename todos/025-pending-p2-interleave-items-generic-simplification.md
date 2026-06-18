---
status: pending
priority: p2
issue_id: "025"
tags: [code-review, display, simplicity, typescript]
dependencies: []
---

# `interleaveItems<A, B>` has two type parameters but is always called with same-typed arrays

## Problem Statement

`lib/utils/display.ts` exports `interleaveItems<A, B>(as: A[], bs: B[]): (A | B)[]`. The two-parameter generic was written for a hypothetical case of interleaving two different types, but the single call site (`display-client.tsx:36`) passes two `DisplayContentItem[]` arrays. The union return type `(A | B)[]` unnecessarily complicates type inference downstream and forces a cast in the test file (`(x as string).startsWith('p')`). A single `<T>` parameter is correct for this usage.

## Findings

- `lib/utils/display.ts:48` — function signature `<A, B>(as: A[], bs: B[]): (A | B)[]`
- `app/display/display-client.tsx:36` — only call site; both args are `DisplayContentItem[]`
- `tests/unit/display.test.ts:194` — `(x as string).startsWith('p')` cast exists because of the union type

## Proposed Solutions

### Option 1: Change to `<T>(as: T[], bs: T[]): T[]`

```ts
export function interleaveItems<T>(as: T[], bs: T[]): T[] {
  const result: T[] = []
  const maxLen = Math.max(as.length, bs.length)
  for (let i = 0; i < maxLen; i++) {
    const a = as[i]
    const b = bs[i]
    if (a !== undefined) result.push(a)
    if (b !== undefined) result.push(b)
  }
  return result
}
```

Also update test file to remove the `as string` casts.

**Pros:** Simpler type, removes cast in tests, return type is `T[]` not `(A | B)[]`
**Cons:** Removes theoretical flexibility for mixed-type interleaving (YAGNI)
**Effort:** Tiny
**Risk:** None

## Recommended Action

Option 1.

## Technical Details

- **Affected files:** `lib/utils/display.ts`, `tests/unit/display.test.ts`

## Acceptance Criteria

- [ ] `interleaveItems` uses single `<T>` type parameter
- [ ] Return type is `T[]`
- [ ] Test file casts removed
- [ ] All existing tests pass

## Work Log

- 2026-06-18: Identified during code review of PR #100 by code-simplicity-reviewer agent.

## Resources

- PR #100: feat(display): light-mode tee-sheet kiosk with tests
