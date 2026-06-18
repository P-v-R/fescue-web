---
status: pending
priority: p3
issue_id: "032"
tags: [code-review, security, headers]
dependencies: []
---

# No `Content-Security-Policy` header configured

## Problem Statement

`next.config.ts` sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `HSTS`, and `Permissions-Policy`, but no `Content-Security-Policy`. The display page renders member names and Sanity content. While React auto-escapes JSX interpolations (making stored XSS via React rendering unlikely), a CSP adds defence-in-depth — particularly relevant for a kiosk browser that is always open.

## Findings

- `next.config.ts` — security headers block missing `Content-Security-Policy`

## Proposed Solutions

### Option 1: Add permissive CSP as starting point

```ts
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' cdn.sanity.io data:; style-src 'self' 'unsafe-inline'; font-src 'self' fonts.gstatic.com",
}
```

`unsafe-inline` on script is required by Next.js hydration; a nonce-based CSP can follow later.

**Effort:** Small
**Risk:** Low — test thoroughly; overly strict CSPs break hydration

## Recommended Action

Option 1, applied globally in `next.config.ts`.

## Acceptance Criteria

- [ ] CSP header present in response for all routes
- [ ] Next.js hydration works with the CSP
- [ ] Sanity image CDN domain allowed in `img-src`

## Work Log

- 2026-06-18: Identified during code review of PR #100 by security-sentinel agent. Note: this applies to the whole app, not just the display route.
