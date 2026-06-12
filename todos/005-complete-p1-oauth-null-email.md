---
status: pending
priority: p1
issue_id: "005"
tags: [security, code-review, auth, oauth]
---

# Non-null Assertion on user.email in OAuth Callback

## Problem Statement
The OAuth membership gate uses `user.email!` (non-null assertion) when querying the members table. Apple Sign In (and certain other OAuth providers) can return a `null` or `undefined` email on repeat sign-ins after the initial authorization. If `user.email` is null, the `.eq('email', undefined)` query either matches all rows or returns no results unexpectedly.

## Findings
**File:** `app/auth/callback/route.ts`, line 34

```typescript
.eq('email', user.email!)
```

- Apple Sign In omits the email after the first sign-in (only returns it once, on initial auth)
- If `user.email` is `undefined`, `.eq('email', undefined)` may return zero results → `!member` is true → user deleted
- A legitimate member using Apple Sign In would have their auth account silently deleted on every repeat login

## Proposed Solution
Add an explicit null check before the DB query:

```typescript
if (!user.email) {
  await admin.auth.admin.deleteUser(user.id)
  return NextResponse.redirect(`${origin}/login?error=not_a_member`)
}
const { data: member } = await admin
  .from('members')
  .select('id')
  .eq('email', user.email)  // no ! needed after the guard
  .maybeSingle()
```

**Effort:** Trivial | **Risk:** None — fail-safe behavior (deny on ambiguity) is preserved

## Acceptance Criteria
- [ ] `user.email` null/undefined redirects to `/login?error=not_a_member` without querying the DB
- [ ] No TypeScript non-null assertion on `user.email` after this guard
- [ ] Existing Apple OAuth sign-in behavior (if tested) is unaffected for members with stored emails
