---
status: pending
priority: p3
issue_id: "014"
tags: [code-review, design-tokens, workbench]
---

# Inconsistent opacity on bullet list text

## Problem Statement
Equipment and Capabilities lists use `text-navy/75`, Operations list uses `text-navy/70`. These are visually indistinguishable but inconsistent in a codebase that tightly controls design tokens.

## Findings
File: `app/(member)/workbench/page.tsx`
- Lines ~99, ~113: `text-navy/75` (Equipment, Capabilities)
- Line ~145: `text-navy/70` (Operations)

## Proposed Fix
Standardize all three bullet lists to `text-navy/70` (already has a dark mode override; `text-navy/75` was the newly added one).

## Acceptance Criteria
- [ ] All three bullet lists use the same opacity value
</content>
</invoke>