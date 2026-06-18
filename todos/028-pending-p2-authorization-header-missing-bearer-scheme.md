---
status: pending
priority: p2
issue_id: "028"
tags: [code-review, display, http, security]
dependencies: []
---

# `Authorization` header sent without a scheme prefix — violates HTTP spec

## Problem Statement

`display-client.tsx` sends the display token as:
```ts
headers: { Authorization: token }
```

The HTTP spec defines `Authorization` as `<scheme> <credentials>` (e.g. `Bearer abc123`). Sending a raw token without a scheme violates the spec and will break any future CDN rule, WAF, or middleware that validates or strips malformed `Authorization` headers. Both sides currently agree on the raw format, so it works today, but it is fragile.

Additionally, the token value is visible in browser DevTools Network tab on the kiosk device since it appears in every polling request header.

## Findings

- `app/display/display-client.tsx:42` — `headers: { Authorization: token }`
- `app/api/display/bookings/route.ts:7` — `request.headers.get('authorization')` (reads raw value)

## Proposed Solutions

### Option 1: Use `Bearer` scheme

Client: `headers: { Authorization: \`Bearer ${token}\` }`
Server: `const raw = request.headers.get('authorization'); const token = raw?.replace(/^Bearer /, '')`

**Pros:** HTTP-compliant, works with standard middleware
**Cons:** Minor change to both files
**Effort:** Tiny
**Risk:** None — both sides updated together

### Option 2: Use a custom header `X-Display-Token`

Client: `headers: { 'X-Display-Token': token }`
Server: `request.headers.get('x-display-token')`

**Pros:** Completely unambiguous, avoids Authorization semantics entirely
**Cons:** Non-standard; less recognizable to future devs
**Effort:** Tiny

## Recommended Action

Option 1 (Bearer scheme) for HTTP compliance.

## Technical Details

- **Affected files:** `app/display/display-client.tsx:42`, `app/api/display/bookings/route.ts:7`

## Acceptance Criteria

- [ ] Client sends `Authorization: Bearer <token>`
- [ ] Server strips `Bearer ` prefix before comparison
- [ ] Existing auth check logic unchanged

## Work Log

- 2026-06-18: Identified during code review of PR #100 by kieran-typescript-reviewer and security-sentinel agents.

## Resources

- PR #100: feat(display): light-mode tee-sheet kiosk with tests
- RFC 7235: https://datatracker.ietf.org/doc/html/rfc7235
