---
status: pending
priority: p3
issue_id: "009"
tags: [cleanup, code-review, dead-code]
---

# Dead appUrl Variable in sendIntroEmailAction

## Problem Statement
`sendIntroEmailAction` computes `appUrl` but immediately silences it with `void appUrl`. This is dead code — the variable is never used.

## Findings
**File:** `app/(admin)/admin/actions.ts`, lines 312–313

```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
void appUrl
```

The `void appUrl` statement is the tell-tale sign that this variable's usage was removed but the declaration was left behind.

## Fix
Delete both lines.

## Acceptance Criteria
- [ ] `appUrl` and `void appUrl` removed from `sendIntroEmailAction`
- [ ] No TypeScript or lint errors
