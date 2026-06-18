---
status: pending
priority: p3
issue_id: "018"
tags: [code-review, documentation]
dependencies: []
---

# PR description says "Supabase realtime" but implementation uses polling

## Problem Statement

The PR #99 body says "live via Supabase realtime" but the actual implementation uses 30-second polling via `/api/display/bookings`. Realtime was attempted but abandoned because Supabase `postgres_changes` subscriptions are blocked by RLS for unauthenticated clients. The PR description was not updated to reflect this.

This is a minor documentation accuracy issue — it could confuse future developers who look at the PR history to understand why polling was chosen.

## Findings

- PR #99 summary: "Bay status shows current and next member per bay (first name only), live via Supabase realtime"
- `app/display/display-client.tsx:37–46` — implementation is `fetch('/api/display/bookings?token=...')` on a 30s interval, not a Supabase realtime subscription
- The commit message on the second commit explains the reason: "Browser client hits RLS and returns nothing without an auth session"

## Proposed Solutions

### Option 1: Update PR description

Edit the PR body to say "30-second polling via server API route" instead of "Supabase realtime". Add a note explaining why realtime was not used (RLS blocks unauthenticated subscriptions).

**Effort:** 2 minutes
**Risk:** None

## Recommended Action

Option 1 — update PR description before merge.

## Acceptance Criteria

- [ ] PR #99 description accurately describes 30s polling, not realtime
- [ ] Brief note in PR explaining the RLS constraint that drove the polling approach

## Work Log

- 2026-06-11: Identified during code review of PR #99.

## Resources

- PR #99: feat: club kiosk display for wall-mounted monitor
