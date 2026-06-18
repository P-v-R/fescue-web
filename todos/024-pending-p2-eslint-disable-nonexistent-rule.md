---
status: pending
priority: p2
issue_id: "024"
tags: [code-review, display, code-quality]
dependencies: [022]
---

# `eslint-disable` comment references non-existent rule `react-hooks/set-state-in-effect`

## Problem Statement

`app/display/bay-status-view.tsx:89` has:
```ts
// eslint-disable-next-line react-hooks/set-state-in-effect
setNowLineTop(null)
```

The rule `react-hooks/set-state-in-effect` does not exist in `eslint-plugin-react-hooks`. The comment suppresses nothing. The actual CI failure that prompted this comment was the React Compiler lint rule from `eslint-plugin-react-compiler`, which is a different package with a different rule ID. The comment is misleading — it implies a real violation exists when none does. Future maintainers may waste time investigating a phantom lint error.

The correct fix is to switch to `useLayoutEffect` (todo 022), which is the right pattern for DOM measurement and would make the lint rule (whatever it was) happy without any suppression.

## Findings

- `app/display/bay-status-view.tsx:89` — spurious eslint-disable comment
- The rule `react-hooks/set-state-in-effect` does not appear in eslint-plugin-react-hooks documentation
- Resolving todo 022 (useLayoutEffect) also resolves this todo as a side-effect

## Proposed Solutions

### Option 1: Remove the comment (requires resolving todo 022 first)

Switch the effect to `useLayoutEffect` (which is the correct pattern regardless), then delete the comment entirely.

**Pros:** Removes misleading comment; correct fix
**Effort:** Tiny (done as part of todo 022)
**Risk:** None

### Option 2: Remove the comment only (if todo 022 deferred)

Simply delete the comment — it suppresses nothing anyway.

**Effort:** Trivial
**Risk:** None

## Recommended Action

Resolve as part of todo 022. If 022 is deferred, remove the comment standalone.

## Technical Details

- **Affected file:** `app/display/bay-status-view.tsx:89`

## Acceptance Criteria

- [ ] Spurious `react-hooks/set-state-in-effect` disable comment removed
- [ ] No new lint errors introduced

## Work Log

- 2026-06-18: Identified during code review of PR #100 by kieran-typescript-reviewer agent.

## Resources

- PR #100: feat(display): light-mode tee-sheet kiosk with tests
