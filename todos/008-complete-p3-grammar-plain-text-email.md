---
status: pending
priority: p3
issue_id: "008"
tags: [copy, code-review, email]
---

# Grammar Error in Plain Text Tour Invite Email

## Problem Statement
The plain-text fallback for the tour invite email has a grammar error: "please reach out sean@fescuegolfclub.com directly" is missing the word "to". This goes to prospects.

## Findings
**File:** `lib/resend/templates/tour-invite.ts`, line 85

```
please reach out sean@fescuegolfclub.com directly.
```

Should be:

```
please reach out to sean@fescuegolfclub.com directly.
```

## Fix
One-line edit. Trivial.

## Acceptance Criteria
- [ ] Plain-text email body reads "reach out to sean@..."
