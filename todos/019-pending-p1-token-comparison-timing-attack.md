---
status: pending
priority: p1
issue_id: "019"
tags: [code-review, security, display]
dependencies: []
---

# Token comparison uses `!==` — vulnerable to timing side-channel attack

## Problem Statement

Both `app/display/page.tsx` and `app/api/display/bookings/route.ts` compare the display token using JavaScript's `!==` operator, which short-circuits on the first differing character. This creates a timing side-channel: an attacker who can make many requests and measure response latency can determine the token one character at a time. The `/api/display/bookings` polling route is a particularly clean oracle since it has minimal processing before the check.

## Findings

- `app/display/page.tsx:24` — `token !== process.env.DISPLAY_TOKEN`
- `app/api/display/bookings/route.ts:8` — `token !== process.env.DISPLAY_TOKEN`

Both need to be replaced with a timing-safe comparison.

## Proposed Solutions

### Option 1: `crypto.timingSafeEqual` with SHA-256 normalisation (recommended)

```ts
import { timingSafeEqual, createHash } from 'crypto'

function tokenValid(candidate: string | null): boolean {
  const expected = process.env.DISPLAY_TOKEN
  if (!expected || !candidate) return false
  const a = createHash('sha256').update(candidate).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}
```

Hashing normalises buffer lengths (required by `timingSafeEqual`). Extract to a shared util so both call sites use the same implementation.

**Pros:** Eliminates timing oracle, Node built-in, zero dependencies
**Cons:** Tiny overhead (negligible for this use case)
**Effort:** Small
**Risk:** None

## Recommended Action

Option 1. Extract `tokenValid()` to `lib/utils/token.ts` and use it in both files.

## Technical Details

- **Affected files:** `app/display/page.tsx`, `app/api/display/bookings/route.ts`
- **New file:** `lib/utils/token.ts`

## Acceptance Criteria

- [ ] `page.tsx` uses `tokenValid()` instead of `!==`
- [ ] `route.ts` uses `tokenValid()` instead of `!==`
- [ ] Shared helper extracted to `lib/utils/token.ts`
- [ ] Existing behaviour preserved: 403 returned on mismatch

## Work Log

- 2026-06-18: Identified during code review of PR #100 by security-sentinel agent.

## Resources

- PR #100: feat(display): light-mode tee-sheet kiosk with tests
- Node.js docs: https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
