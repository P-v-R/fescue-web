---
status: pending
priority: p2
issue_id: "027"
tags: [code-review, display, middleware, robustness]
dependencies: []
---

# `/display` route not explicitly excluded from middleware — implicit pass-through is fragile

## Problem Statement

`proxy.ts` explicitly defines `MEMBER_ROUTES`, `ADMIN_ROUTES`, `AUTH_ROUTES`, and `MARKETING_ROUTES`, but `/display` is not in any group. The middleware runs (the matcher covers all routes) but falls through all branches to a bare `return supabaseResponse`. This is the intended behaviour — the display page handles its own token auth — but it is implicit. A future refactor that adds a catch-all authenticated redirect at the bottom of the middleware would accidentally block the kiosk.

## Findings

- `proxy.ts` — `/display` not mentioned in any route group
- The path falls through all `if` blocks silently
- The polling API `/api/display/bookings` is also unprotected by middleware (correct, but also implicit)

## Proposed Solutions

### Option 1: Add an explicit early-return for `/display` paths

```ts
// proxy.ts — near the top of the proxy function
if (pathname.startsWith('/display') || pathname.startsWith('/api/display')) {
  // Token-gated at the page/route level — no session required
  return supabaseResponse
}
```

**Pros:** Intent is explicit; future maintainers understand why it bypasses auth; safe against catch-all additions
**Cons:** Tiny boilerplate
**Effort:** Tiny
**Risk:** None

### Option 2: Add to matcher exclusion list in middleware config

Add `/display(.*)` and `/api/display(.*)` to the `matcher` negative-lookahead in `next.config.ts` / `middleware.ts`.

**Pros:** Middleware never runs for these paths at all
**Cons:** Less visible than in-code comment
**Effort:** Tiny

## Recommended Action

Option 1 — explicit early-return in `proxy.ts` with a comment is the most readable.

## Technical Details

- **Affected file:** `proxy.ts`

## Acceptance Criteria

- [ ] `/display` and `/api/display` paths have explicit early-return in `proxy.ts`
- [ ] Comment explains why they bypass session auth
- [ ] Existing middleware behaviour for all other routes unchanged

## Work Log

- 2026-06-18: Identified during code review of PR #100 by security-sentinel agent.

## Resources

- PR #100: feat(display): light-mode tee-sheet kiosk with tests
