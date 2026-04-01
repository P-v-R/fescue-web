# Agent-Native Architecture Audit
_Run: 2026-03-31_

## Overall Score: 41%

| Core Principle | Score | % | Status |
|---|---|---|---|
| Action Parity | 0/62 | 0% | ❌ |
| Tools as Primitives | 2/19 | 11% | ❌ |
| Context Injection | 10/14 | 71% | ⚠️ |
| Shared Workspace | 14/17 | 82% | ✅ |
| CRUD Completeness | 8/11 | 73% | ⚠️ |
| UI Integration | 2/5 | 40% | ❌ |
| Capability Discovery | 1/7 | 14% | ❌ |
| Prompt-Native Features | 4/10 | 40% | ❌ |

---

## Key Findings

### Strengths
- Service role client gives an agent identical access to all 14 shared tables
- `lib/supabase/queries/` is clean, typed, and agent-consumption-ready
- Booking/cancel realtime loop works well (Supabase channel on `bookings`)
- `auth_is_admin()` checks both `is_admin` and `is_active` — deactivated accounts auto-locked
- 8/11 entities have full CRUD

### Biggest Gaps
- Zero agent tooling (no MCP server, no tool definitions, no LLM client)
- Admin actions (blackouts, events, member mgmt) have no realtime push — silent action risk
- No help/discovery surface for users
- All business rules are hardcoded TypeScript, not externalizable

---

## Top 10 Recommendations (priority order)

1. Build `/app/api/tools/` — expose 35 server actions as HTTP endpoints with Zod schemas
2. **Add realtime to `blackout_periods` + `events` tables** ← also a real bug today, fix regardless
3. Create `lib/ai/context-builder.ts` — serialize member state for injection (data already queryable)
4. Add `/help` page + 3 lines to post-invite welcome about agent capabilities
5. Add bay CRUD admin UI (only entity at 25% — read-only today)
6. Add booking rescheduling (`updateBooking`)
7. Decompose `approveJoinRequestAction` into atomic primitives
8. Add `created_by_agent: boolean` to `bookings` + `events`
9. Prompt-driven email copy generation as LLM entry point
10. Externalise booking rules to config/Sanity

---

## CRUD Gaps
| Entity | Missing |
|---|---|
| Member | Create (no direct admin add) |
| Invite | Update |
| Booking | Update (reschedule) |
| Bay | Create, Update, Delete |
| Blackout Period | Update |
| Membership Request | Delete |

---

## UI Integration — Silent Action Risks
| Feature | Risk |
|---|---|
| Blackout periods | Admin blocks slot, member still sees it as bookable until refresh |
| Events | Admin creates event, calendar doesn't update until month change |
| Member deactivation | Deactivated member still sees portal until logout |
