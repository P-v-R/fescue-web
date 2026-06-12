---
status: pending
priority: p1
issue_id: "003"
tags: [data-integrity, code-review, server-actions]
---

# scheduleTourAction Does Not Persist Tour Date to DB

## Problem Statement
`scheduleTourAction` sends the email and .ics attachment but never writes anything to the database. The `tour_date` column and `pipeline` status are only set if the admin separately clicks "Yes, Mark as Pipeline" in the modal — a second, optional step. If the admin closes the browser after the email sends, the DB remains in an inconsistent state: the prospect received a tour invite, but the record has no record of it.

## Findings
**File:** `app/(admin)/admin/actions.ts`, lines 397–444

- `scheduleTourAction` returns `{ success }` after Resend API call with zero DB writes
- `markPipelineAction` (lines 446–462) is the only place `tour_date` and `pipeline` status are written
- The modal shows a "Yes, Mark as Pipeline?" prompt after send — skipping it leaves the record at `contacted`
- The `RequestCard` tour date display (prospects-tab.tsx:805–809) will never render for these prospects
- No audit trail that a tour invite was ever sent

## Proposed Solutions

### Option A: Write DB inside scheduleTourAction (Recommended)
After successful Resend call, call `updateMembershipRequestStatus(requestId, 'pipeline', { tour_date })` atomically. Keep the two-step UX modal as-is, but remove the `markPipelineAction` server action entirely — the modal's "Yes" button just closes, and "No/Skip" also just closes (status already written).

**Effort:** Small | **Risk:** Low — adds a single DB write inside an existing try/catch

### Option B: Add invite_sent_at column
Add a `tour_invite_sent_at timestamptz` column. `scheduleTourAction` writes this timestamp. `markPipelineAction` stays as the separate status-promotion step. This preserves the two-step intent but at least provides an audit trail.

**Effort:** Medium (requires new migration) | **Risk:** Low

## Acceptance Criteria
- [ ] After `scheduleTourAction` succeeds, the `membership_requests` row reflects the tour date
- [ ] Closing the modal early after email sends does not leave the DB in an inconsistent state
- [ ] `markPipelineAction` either removed or made redundant by the DB write in step 1
