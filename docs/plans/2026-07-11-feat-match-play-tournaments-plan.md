---
title: "feat: Match Play Tournaments"
type: feat
status: in-progress
date: 2026-07-11
---

# Match Play Tournaments

## Overview

Club-run **match-play tournaments** that live alongside the existing read-only Simulator Golf Tour (SGT) views at `/tournaments`. Admins create a tournament; members self-register; the tournament runs a **single- or double-elimination bracket**. Each bracket round is played as an SGT event (a stroke-play round on a course), and the app computes a **hole-by-hole net match-play result** (100% allowance — strokes = higher HCP − lower HCP, allocated on the hardest holes by stroke index). Admins can seed, issue forfeits/byes, and move players around the bracket. A single champion ends the tournament.

The work is phased. Phases 1–3 (creation, registration, bracket engine + seeding) are implemented in this pass; phases 4–5 (SGT scoring + visual bracket) are follow-ups.

## Proposed Solution

Three new tables (`tournaments`, `tournament_registrations`, `tournament_matches`) with RLS mirroring the `events` / `event_rsvps` precedent. A new admin **Tournaments** tab drives the full lifecycle; a new member detail route handles registration and (later) bracket viewing. A pure, unit-tested bracket engine (`lib/tournament/`) generates the draw; the existing `lib/sgt/` client is the scoring data source for match resolution.

Tournament lifecycle status: `draft → registration → seeding → in_progress → completed` (plus `cancelled`).

## Technical Considerations

- **Routing**: `/tournaments` gains a "Match Play" section listing DB tournaments above the SGT tours. Detail pages live at `/tournaments/match-play/[id]` — a static segment that coexists cleanly with the numeric SGT `[tourId]` route (static wins).
- **RLS**: members read all; admins write. Registrations allow self-insert (`member_id = auth.uid()`) + admin override, mirroring `event_rsvps`.
- **Handicap source**: the SGT scorecard `hcp_index` — no new handicap column on `members`. Members are linked to SGT via the existing `members.sgt_username`.
- **Bracket wiring**: `tournament_matches` carries explicit advancement slots (`next_match_id`/`next_match_slot`, `loser_match_id`/`loser_match_slot`) so the resolver knows which side of the downstream match a winner/loser fills — deterministic advancement for both bracket types.
- **Engine purity**: `lib/tournament/bracket.ts` works entirely in seeds + integer `localId`s (no randomness), so it is deterministic and testable. `build-rows.ts` maps its output to DB rows, with the caller injecting the uuid generator.
- **Byes**: fields that aren't a power of two pad up to the next power of two; top seeds receive byes, which auto-resolve (the real player is pre-advanced, match marked `is_bye` / `completed`).
- **Server actions**: standard pattern — `safeParse` (`.issues`), `getUser()`, `{ error }` / `{ success }`, `revalidatePath`. Admin mutations go through `createAdminClient()` after `requireAdmin()`.

### SGT club-admin API (scoring source — Phase 4)

Docs: https://simulator-golf-tour.gitbook.io/sgt-club-admin-api · OpenAPI: https://simulatorgolftour.com/public/club-admin-help/api.yaml · base URL `.../sgt-api/club-admin/fescuegc` (auth via `api-key`; handled by `lib/sgt/client.ts`).

- `GET /tournaments/scorecards?tournamentId=` returns per-hole `hole1_gross..hole18_gross`, `hole1_net..hole18_net`, stroke index `h1_index..h18_index`, par `h1_Par..h18_Par`, plus `courseName`, `hcp_index`, `playerId`. Everything the hole-by-hole net engine needs.
- `GET /members/list` maps `user_name` (== our `sgt_username`) → numeric `user_id` (the `playerId`).
- Write flow: `POST /tournaments/create` (needs `tourId` + details — read exact body from `api.yaml`), `POST /tours/create`, `POST /registrations/add` (`tournamentId`, `playerId`).

## Files to Create / Modify

### New files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260709000000_tournaments.sql` | `tournaments` table + RLS |
| `supabase/migrations/20260709000001_tournament_registrations.sql` | `tournament_registrations` + RLS + champion FK |
| `supabase/migrations/20260709000002_tournament_matches.sql` | `tournament_matches` + RLS + index |
| `lib/validations/tournament.ts` | Zod create/update schema |
| `lib/supabase/queries/tournaments.ts` | Tournament CRUD + status queries |
| `lib/supabase/queries/tournament-registrations.ts` | Registration reads/writes (member + admin) |
| `lib/supabase/queries/tournament-matches.ts` | Bracket insert/fetch/delete, player move, seed persistence |
| `lib/tournament/bracket.ts` | Pure single/double-elim generation engine |
| `lib/tournament/build-rows.ts` | Maps engine output → insertable match rows |
| `app/(admin)/admin/tabs/tournaments-tab.tsx` | Admin Tournaments tab (create/edit/field/seed/draw) |
| `app/(member)/tournaments/actions.ts` | Member register / withdraw actions |
| `app/(member)/tournaments/match-play/[id]/page.tsx` | Member tournament detail page |
| `components/tournaments/registration-button.tsx` | Client register/withdraw control |
| `tests/unit/bracket.test.ts` | Bracket engine tests |
| `tests/unit/tournament-registration.test.ts` | Registration action tests |

### Modified files

| File | Change |
|------|--------|
| `lib/supabase/types.ts` | Add `Tournament*`, `TournamentRegistration*`, `TournamentMatch` types |
| `app/(admin)/admin/actions.ts` | Tournament CRUD, registration, seeding, bracket, move actions |
| `app/(admin)/admin/admin-client.tsx` | Wire the Tournaments tab + props |
| `app/(admin)/admin/page.tsx` | Fetch tournaments + registrations |
| `app/(member)/tournaments/page.tsx` | Add Match Play section |

## Implementation Phases

### Phase 1 — Tournament data model + admin creation ✅
`tournaments` table + types + validation + queries + admin CRUD actions + a new Tournaments admin tab (create/edit/delete, open/close registration).

### Phase 2 — Member registration ✅
`tournament_registrations` table + register/withdraw actions (enforce status, deadline, capacity, duplicates) + admin add/remove-participant + close-registration. Member Match Play section and `/tournaments/match-play/[id]` detail page with register/withdraw + roster.

### Phase 3 — Bracket generation, seeding, admin manipulation ✅
`tournament_matches` table + pure `bracket.ts` engine (single + double elim, standard seeding, byes, self-referential wiring) + `build-rows.ts` + seed/generate/reset/move actions + a seeding panel in the admin tab (reorder, draw bracket).

### Phase 4 — Match-play scoring engine + SGT round linkage (pending)
- `lib/tournament/matchplay.ts` (pure): `resolveMatch(p1, p2)` computing hole-by-hole net from `hole*_gross` + `h*_index` (100% allowance; strokes to holes where `strokeIndex ≤ strokesGiven`, second pass beyond 18; gross 0 = unplayed).
- `lib/sgt/` groundwork: `SgtHoleScorecard` / `SgtClubMember` types, `getClubMembers()`, `resolvePlayerId(sgtUsername)`, `getMatchScorecards(tournamentId)`, a `sgtPost()` helper, `createSgtTournament()`, `addRegistration()`.
- `startRoundAction` creates the SGT event + registers both players; `resolveMatchAction` computes the result, sets the winner, and advances (winner → `next_match`, loser → `loser_match` for double elim). Admin `forfeitMatchAction` / `setMatchWinnerAction` overrides.

### Phase 5 — Bracket display + completion (pending)
- `components/tournaments/bracket.tsx` — member bracket view; completed matches link to their SGT leaderboard and show the result (e.g. "3 & 2").
- On the final match resolving, set `status = 'completed'` + `champion_registration_id` and render a champion banner. Optional matchup notifications.

## Acceptance Criteria

- [x] Admin can create a tournament (single/double elim, capacity, registration deadline, start time) and it appears in the Tournaments tab.
- [x] Admin can open registration; members see it under Match Play on `/tournaments`.
- [x] Members can register and withdraw while registration is open; capacity, deadline, and duplicates are enforced.
- [x] Admin can add/remove any member and close registration.
- [x] Admin can reorder seeds and draw the bracket; byes auto-resolve for non-power-of-two fields.
- [x] Bracket engine produces correct match counts, bye placement, and advancement wiring for single and double elimination (unit-tested).
- [ ] A bracket round can be played through SGT and resolved to a hole-by-hole net match result, advancing the winner. *(Phase 4)*
- [ ] Members see a visual bracket; the final resolves to a single champion and the tournament completes. *(Phase 5)*

## Dependencies & Risks

- **SGT write endpoints** (`/tournaments/create`, `/registrations/add`) are needed for Phase 4; the exact `/tournaments/create` request body must be read from `api.yaml` at implementation time.
- **Per-hole scoring** relies on `/tournaments/scorecards` returning `hole*_gross` + `h*_index`; the match engine computes net itself rather than trusting SGT's own net (the match allowance differs).
- **Double elimination with a non-power-of-two field** may need a manual player-move for losers-bracket byes; single elimination handles byes fully, and power-of-two double elimination is fully wired.
- **Open questions**: round length (9 vs 18 holes) and whether a match spans one SGT event or a date window; tie-break when a net match is all-square after the round (count-back vs admin call).

## References

- Registration precedent: `supabase/migrations/20260316000001_event_rsvps.sql`, `lib/supabase/queries/event-rsvps.ts`
- Admin tab pattern: `app/(admin)/admin/admin-client.tsx`, `app/(admin)/admin/tabs/events-tab.tsx`, `app/(admin)/admin/components/admin-ui.tsx`
- Server action pattern: `app/(admin)/admin/actions.ts` (`requireAdmin`, `createEventAction`)
- SGT client: `lib/sgt/client.ts`, `lib/sgt/queries.ts`; member linkage `lib/supabase/queries/members.ts` (`getMemberNamesBySgtUsername`)
- Match-play handicap allowance (WHS): USGA Appendix C — singles match play is 100% of the course-handicap difference, allocated by stroke index
- Design tokens: `app/globals.css` (`--navy`, `--cream`, `--gold`, `--sage`)
