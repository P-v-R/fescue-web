---
status: pending
priority: p1
issue_id: "004"
tags: [validation, code-review, server-actions]
---

# tourDatetimeLocal Not Validated Before new Date()

## Problem Statement
Both `scheduleTourAction` and `markPipelineAction` call `new Date(tourDatetimeLocal)` on a client-supplied string without any format validation. An empty string, `"invalid"`, or a malformed value produces `Invalid Date`, causing `format()` to throw (caught as a generic error) and `tourInviteIcs()` to receive an `Invalid Date` that produces `NaN` in the ICS output.

## Findings
**Files:**
- `app/(admin)/admin/actions.ts:410` — `scheduleTourAction`
- `app/(admin)/admin/actions.ts:453` — `markPipelineAction`

`new Date('')` → `Invalid Date`; subsequent `.toISOString()` throws `RangeError`. The outer `try/catch` catches it as generic `'Failed to update status.'` with no indication of what was wrong.

## Proposed Solution
Add a format guard at the top of both actions before calling `new Date()`:

```typescript
const datetimeLocalPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
if (!datetimeLocalPattern.test(tourDatetimeLocal)) {
  return { error: 'Invalid tour date format.' }
}
const tourDate = new Date(tourDatetimeLocal)
if (isNaN(tourDate.getTime())) {
  return { error: 'Invalid tour date.' }
}
```

**Effort:** Small | **Risk:** None

## Acceptance Criteria
- [ ] Empty string input returns `{ error: 'Invalid tour date format.' }`
- [ ] Malformed string returns a descriptive error, not a generic one
- [ ] Valid `YYYY-MM-DDTHH:MM` format proceeds as before
