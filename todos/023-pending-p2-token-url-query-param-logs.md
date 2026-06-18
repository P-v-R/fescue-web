---
status: pending
priority: p2
issue_id: "023"
tags: [code-review, security, display, operational]
dependencies: []
---

# Display token in URL query param appears in server logs, browser history, and Sentry

## Problem Statement

The display token is passed as `?token=<secret>` in the page URL. This means the token appears in plain text in Railway HTTP access logs, Sentry transaction traces (Sentry is configured via `withSentryConfig`), browser history on the kiosk device, and any CDN/proxy access logs. Since this is a long-lived secret baked into the kiosk browser startup URL, exposure in logs is a persistent leak.

The API route correctly moved to an `Authorization` header; the page itself still uses the query param.

## Findings

- `app/display/page.tsx:22` — `const { token } = await searchParams`
- Railway logs full request URLs by default
- `next.config.ts` wraps with `withSentryConfig` — Sentry captures transactions including URLs
- Kiosk URL is stored in browser history/bookmarks

## Proposed Solutions

### Option 1: Operational mitigations only (no code change)

1. Configure Railway to redact `?token=*` from access logs
2. Configure Sentry to scrub `token` from URL query params in `sentry.client.config.ts`
3. Rotate the token periodically

**Pros:** Zero code change
**Cons:** Relies on ops discipline; Sentry scrubbing config is easy to forget
**Effort:** Small (ops)
**Risk:** None

### Option 2: Switch page auth to HttpOnly cookie (recommended for full fix)

On first load with valid token, set an HttpOnly signed cookie and redirect to `/display` (no token in URL). Subsequent loads use the cookie. The `DISPLAY_TOKEN` remains only in env vars, never in URLs.

**Pros:** Token never in logs, history, or Sentry. Also removes it from SSR props and DevTools (resolves todo 028 too)
**Cons:** More complex; requires signed cookie generation
**Effort:** Medium
**Risk:** Low

## Recommended Action

Option 1 as immediate mitigation (ops task), Option 2 tracked for hardening.

## Technical Details

- **Affected file:** `app/display/page.tsx`
- Sentry scrubbing: add `token` to `beforeSend` URL scrubbing in `sentry.client.config.ts`

## Acceptance Criteria

- [ ] Railway log scrubbing configured for `token` query param
- [ ] Sentry configured to scrub `token` from transaction URLs
- [ ] OR: cookie-based auth implemented so token never appears in URL

## Work Log

- 2026-06-18: Identified during code review of PR #100 by security-sentinel agent.

## Resources

- PR #100: feat(display): light-mode tee-sheet kiosk with tests
- Railway log scrubbing docs
