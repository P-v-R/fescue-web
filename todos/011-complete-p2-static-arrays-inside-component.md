---
status: pending
priority: p2
issue_id: "011"
tags: [code-review, performance, workbench]
---

# Static content arrays defined inside async component body

## Problem Statement
`equipment`, `capabilities`, and the inline Operations array are defined inside `WorkbenchPage()`. These are static strings that never change, yet they are re-allocated on every server render request.

## Findings
File: `app/(member)/workbench/page.tsx`

- `equipment` (line ~44) — `string[]` defined inside async function
- `capabilities` (line ~53) — `string[]` defined inside async function
- Operations array (line ~142) — anonymous inline array inside `.map()` in JSX

## Proposed Fix
Move all three to module scope above the component:
```ts
const EQUIPMENT = ['Loft / Lie Machine', 'Bench Vise', ...] as const
const CAPABILITIES = ['Loft and lie adjustments', ...] as const
const OPERATIONS = ['Shared club resource available to all members', ...] as const
```
Then replace the inline Operations `.map()` with `OPERATIONS.map(...)`.

Also move `const GOAL = parseInt(process.env.WORKBENCH_GOAL ?? '2500', 10)` to module scope — `process.env` reads are fine at module init time on the server.

## Acceptance Criteria
- [ ] All three arrays are module-level constants
- [ ] `as const` applied for better type inference
- [ ] No behavior change
</content>
</invoke>