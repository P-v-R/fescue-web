---
status: pending
priority: p1
issue_id: "001"
tags: [security, code-review, ics, injection]
---

# ICS Injection via prospectName and prospectEmail

## Problem Statement
`tourInviteIcs()` interpolates `prospectName` and `prospectEmail` directly into the ICS file without sanitization. The iCalendar format uses `\r\n` as a line terminator, so a value containing `\r\n` lets an attacker inject arbitrary iCalendar properties into the generated `.ics` file. Both fields originate from unauthenticated public form submissions (`/contact`).

## Findings
**File:** `lib/resend/templates/tour-invite.ts`, lines 130–133

```
`DESCRIPTION:Tour at Fescue Golf Club for ${prospectName}`,
`ATTENDEE;CN=${prospectName};ROLE=REQ-PARTICIPANT:mailto:${prospectEmail}`,
```

A `prospectName` of `Legit Name\r\nATTENDEE;ROLE=REQ-PARTICIPANT:mailto:attacker@evil.com` adds an unintended attendee to the calendar invite. A malicious prospect could also inject `METHOD:CANCEL` to cancel the invite or add phishing content.

OWASP A03 (Injection) — FAIL.

## Proposed Solutions

### Option A: Minimal escape function (Recommended)
Add an `escapeIcsText()` helper that strips `\r\n` and escapes `;`, `,`, `\` per RFC 5545 TEXT type:

```typescript
function escapeIcsText(value: string): string {
  return value
    .replace(/[\r\n]+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .slice(0, 200)
}
```

Apply to `prospectName` on both lines. For `prospectEmail`, additionally strip everything after the first space and validate RFC 5321 format before use.

**Effort:** Small | **Risk:** None — purely additive sanitization

### Option B: Allowlist validation at action layer
Validate `prospectName` and `prospectEmail` in `scheduleTourAction` before they reach the template, returning `{ error }` if they contain `\r`, `\n`, or other dangerous characters.

**Effort:** Small | **Risk:** Low — slightly tighter than needed

## Acceptance Criteria
- [ ] `prospectName` containing `\r\n` does not inject new iCalendar lines
- [ ] `prospectEmail` containing `;` or newline does not break the ATTENDEE property
- [ ] Escaping follows RFC 5545 section 3.3.11 (TEXT type)
- [ ] Existing test for `tourInviteIcs()` updated to cover injection payloads
