---
status: pending
priority: p2
issue_id: "006"
tags: [correctness, code-review, ics, timezone]
---

# ICS Timezone Conversion Relies on TZ Env Var With No Enforcement

## Problem Statement
`tourInviteIcs()` converts the local datetime string to UTC by calling `new Date(tourDatetimeLocal)` — a "local time" parse in Node.js that depends entirely on the ambient `TZ` environment variable. If `TZ` is not set to `America/Los_Angeles` (e.g. in CI, a new Railway service deployment, or a developer's local machine), every ICS will silently have the wrong start time.

## Findings
**File:** `lib/resend/templates/tour-invite.ts`, lines 107–108

```typescript
const tourDate = new Date(tourDatetimeLocal); // "local time" = server TZ
const icsDate = tourDate.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
```

The comment documents the assumption but does not enforce it. The `.env.example` documents `TZ=America/Los_Angeles` but a misconfigured Railway service would silently send calendar invites 7–8 hours off.

## Proposed Solutions

### Option A: Add a TZ assertion at startup (Quick fix)
In `lib/resend/templates/tour-invite.ts` or a server startup file, assert:

```typescript
if (process.env.TZ !== 'America/Los_Angeles') {
  console.warn('[tour-invite] TZ env var is not set to America/Los_Angeles — ICS times may be wrong')
}
```

**Effort:** Trivial | **Risk:** None — just a warning

### Option B: Use date-fns-tz for explicit timezone conversion (Recommended long-term)
```typescript
import { fromZonedTime } from 'date-fns-tz'
const tourDateUtc = fromZonedTime(tourDatetimeLocal, 'America/Los_Angeles')
const icsDate = tourDateUtc.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
```

This makes the timezone explicit in code, not in environment configuration.

**Effort:** Small (one new dependency: `date-fns-tz`) | **Risk:** Low

## Acceptance Criteria
- [ ] A missing or incorrect `TZ` env var produces a visible warning (Option A) or has no effect on ICS correctness (Option B)
- [ ] Calendar events created during daylight saving time and standard time are both correct
