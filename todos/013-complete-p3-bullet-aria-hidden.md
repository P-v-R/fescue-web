---
status: pending
priority: p3
issue_id: "013"
tags: [code-review, accessibility, workbench]
---

# Decorative bullet spans missing aria-hidden

## Problem Statement
The decorative dot `<span>` used as a visual bullet in every list item is not marked `aria-hidden="true"`. Some screen reader / browser combinations may announce it as an empty element, creating noise in the AT output.

## Findings
File: `app/(member)/workbench/page.tsx` — every bullet list item:
```tsx
<span className="mt-1.5 w-1 h-1 rounded-full bg-navy/25 shrink-0" />
```
Should be:
```tsx
<span aria-hidden="true" className="mt-1.5 w-1 h-1 rounded-full bg-navy/25 shrink-0" />
```
The `<ul>/<li>` structure already provides list semantics. The dot is purely decorative.

## Acceptance Criteria
- [ ] All bullet dot spans have `aria-hidden="true"`
</content>
</invoke>