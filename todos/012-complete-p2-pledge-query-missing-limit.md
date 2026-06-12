---
status: pending
priority: p2
issue_id: "012"
tags: [code-review, performance, database, workbench]
---

# Pledge query has no row limit

## Problem Statement
The `workbench_pledges` query fetches all rows with no `.limit()`. The multi-pledge migration (20260517) dropped the unique-per-user constraint, meaning a single member can pledge multiple times. Without a ceiling the query and DOM render are unbounded.

## Findings
File: `app/(member)/workbench/page.tsx` line ~34:
```ts
const { data: pledges } = await supabase
  .from('workbench_pledges')
  .select('id, discord_user_id, discord_username, amount, note, created_at')
  .order('amount', { ascending: false })
  // missing: .limit(200)
```

## Proposed Fix
```ts
.order('amount', { ascending: false })
.limit(200)
```
200 is a safe ceiling for a small club fundraiser — well above any realistic pledge count while preventing runaway queries.

## Acceptance Criteria
- [ ] `.limit()` added to the Supabase query
- [ ] Pledge board still renders correctly with existing data
</content>
</invoke>