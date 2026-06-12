---
status: pending
priority: p2
issue_id: "007"
tags: [architecture, code-review, server-actions, simplicity]
---

# markPipelineAction Should Be Merged into scheduleTourAction

## Problem Statement
`scheduleTourAction` and `markPipelineAction` are always intended to run together (send invite + mark pipeline). Splitting them into two separate server actions with two separate auth checks means 4 Supabase round-trips per full flow. More importantly, `markPipelineAction` is only meaningful after `scheduleTourAction` succeeds — it has no standalone use case, but exporting it as a public server action implies it does.

This is tracked as a dependency of #003 (no DB write). If #003 is resolved by having `scheduleTourAction` write the DB, `markPipelineAction` can be deleted entirely.

## Findings
- `app/(admin)/admin/actions.ts:446–462` — `markPipelineAction` is only called from `ScheduleTourModal`
- Calling `markPipelineAction` without a prior `scheduleTourAction` sets `status=pipeline` with a `tour_date` but no email sent
- Exports a misleading API surface implying the actions are independent

## Proposed Solution
Resolve #003 first (make `scheduleTourAction` write the DB). Then delete `markPipelineAction` and remove its import from `prospects-tab.tsx`. The modal's "Yes, Mark as Pipeline?" step becomes a UI-only confirm that doesn't fire any additional server action.

**Effort:** Small | **Risk:** Low — dependent on #003

## Acceptance Criteria
- [ ] `markPipelineAction` is removed (or internalized as a private helper)
- [ ] `scheduleTourAction` is the only exported action needed for the full flow
- [ ] Modal UX remains the same (two-step confirm is fine, just doesn't need two server round-trips)
