---
status: pending
priority: p2
issue_id: "010"
tags: [code-review, accessibility, workbench]
---

# Section label `<p>` tags should be `<h2>` elements

## Problem Statement
All section labels on the workbench page ("Equipment", "Capabilities", "Budget", "Operations", "How to Pledge", "Important Note") are rendered as `<p>` tags. The document heading hierarchy is flat — only the `<h1>` exists. Screen reader users navigating by heading will find no sub-sections.

## Findings
File: `app/(member)/workbench/page.tsx`

Every section uses the pattern:
```tsx
<p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
  Equipment
</p>
```
Should be:
```tsx
<h2 className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
  Equipment
</h2>
```
Visual output is identical. Semantic structure is correct.

## Acceptance Criteria
- [ ] All section labels in `workbench/page.tsx` use `<h2>` instead of `<p>`
- [ ] Visual appearance unchanged
</content>
</invoke>