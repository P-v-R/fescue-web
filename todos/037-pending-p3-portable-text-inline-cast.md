---
status: pending
priority: p3
issue_id: "037"
tags: [code-review, display, typescript]
dependencies: []
---

# Inline cast on Sanity PortableText block discards type information

## Problem Statement

`content-slide.tsx` casts PortableText body blocks to an anonymous inline type:
```ts
const children = (block as { children?: { text?: string }[] }).children ?? []
```

`BulletinPost['body']` is typed as `PortableTextBlock[] | null` where `PortableTextBlock` from `@portabletext/types` already has a `children` property. The inline cast to an anonymous object discards all other type information on the block and is effectively a weakened `any`. If the Sanity type changes, TypeScript will not catch the mismatch.

## Findings

- `app/display/content-slide.tsx:17-19` — inline anonymous cast

## Proposed Solutions

### Option 1: Import `PortableTextBlock` and use it directly

```ts
import type { PortableTextBlock } from '@portabletext/types'

// In extractPlainText:
.map((block) => {
  const children = (block as PortableTextBlock).children ?? []
  return children.map((c) => (c as { text?: string }).text ?? '').join('')
})
```

Or check whether the existing `BulletinPost['body'][number]` type already exposes `.children` without a cast.

**Effort:** Small
**Risk:** None — behavior unchanged, types tightened

## Recommended Action

Option 1. Read the actual `BulletinPost` type definition in `lib/sanity/types.ts` first to see if a cast is even needed.

## Technical Details

- **Affected file:** `app/display/content-slide.tsx:17-19`

## Acceptance Criteria

- [ ] Anonymous inline cast replaced with a named type
- [ ] No new TypeScript errors

## Work Log

- 2026-06-18: Identified during code review of PR #100 by kieran-typescript-reviewer agent.
