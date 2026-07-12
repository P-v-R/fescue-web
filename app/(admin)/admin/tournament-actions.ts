'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from './admin-guard'
import { getTournamentById, setTournamentSgtTour, setTournamentChampion } from '@/lib/supabase/queries/tournaments'
import { getRegistrationsForTournament } from '@/lib/supabase/queries/tournament-registrations'
import {
  getMatchById,
  getRoundMatches,
  setRoundSgtEvent,
  completeMatch,
  setMatchNeedsDecision,
  setMatchPlayer,
} from '@/lib/supabase/queries/tournament-matches'
import {
  createSgtTour,
  createSgtRoundEvent,
  editSgtRoundEvent,
  deleteSgtRoundEvent,
  registerRoundPlayers,
  getScorecards,
  playerRoundFromCards,
  resolvePlayerIds,
} from '@/lib/sgt/matches'
import { resolveMatch } from '@/lib/tournament/matchplay'
import type { SgtRoundSettings, TournamentMatch, TournamentRegistrationWithMember } from '@/lib/supabase/types'

type Result = { error?: string; success?: string }

type RoundSettingsInput = {
  courseId: number
  numberholes: string
  greenspeed: number
  gimmes: string
  puttingmode: string
  tees: string
}

function revalidate(tournamentId: string) {
  revalidatePath('/admin')
  revalidatePath(`/tournaments/match-play/${tournamentId}`)
  revalidatePath('/tournaments')
}

// Winner advances; loser drops (double elim); a match with no next_match crowns the champion.
async function advance(
  match: TournamentMatch,
  winnerRegistrationId: string,
  loserRegistrationId: string | null,
): Promise<void> {
  if (match.next_match_id && match.next_match_slot) {
    await setMatchPlayer(match.next_match_id, match.next_match_slot, winnerRegistrationId)
  }
  if (match.loser_match_id && match.loser_match_slot && loserRegistrationId) {
    await setMatchPlayer(match.loser_match_id, match.loser_match_slot, loserRegistrationId)
  }
  if (!match.next_match_id) {
    await setTournamentChampion(match.tournament_id, winnerRegistrationId)
  }
}

function otherPlayer(match: TournamentMatch, registrationId: string): string | null {
  if (match.player1_registration_id === registrationId) return match.player2_registration_id
  if (match.player2_registration_id === registrationId) return match.player1_registration_id
  return null
}

function regLabel(regs: Map<string, TournamentRegistrationWithMember>, id: string | null): string {
  return (id && regs.get(id)?.members?.full_name) || 'a player'
}

// Builds the SGT round settings, tagging the event with the tournament + round label.
function buildSettings(name: string, roundLabel: string, input: RoundSettingsInput): SgtRoundSettings {
  return {
    tourneyname: `${name} — ${roundLabel}`,
    courseId: input.courseId,
    numberholes: input.numberholes,
    greenspeed: input.greenspeed,
    gimmes: input.gimmes,
    puttingmode: input.puttingmode,
    tees: input.tees,
  }
}

function roundLabelOf(match: TournamentMatch): string {
  const bracket =
    match.bracket === 'winners' ? 'Winners' : match.bracket === 'losers' ? 'Losers' : 'Grand Final'
  return match.bracket === 'grand_final' ? bracket : `${bracket} R${match.round}`
}

// Resolves each playable match's two players to SGT user ids + head-to-head pairs.
async function resolvePairs(
  matches: TournamentMatch[],
  regs: Map<string, TournamentRegistrationWithMember>,
): Promise<{ pairs: { userId: number; opponentId: number }[]; error?: string }> {
  const usernames: string[] = []
  for (const m of matches) {
    for (const rid of [m.player1_registration_id, m.player2_registration_id]) {
      const u = rid ? regs.get(rid)?.members?.sgt_username : null
      if (rid && !u) return { pairs: [], error: `${regLabel(regs, rid)} has no SGT username set.` }
      if (u) usernames.push(u)
    }
  }
  const idMap = await resolvePlayerIds(usernames)
  const missing = usernames.filter((u) => !idMap.has(u.toLowerCase()))
  if (missing.length > 0) {
    return { pairs: [], error: `SGT could not find these usernames: ${missing.join(', ')}.` }
  }

  const pairs: { userId: number; opponentId: number }[] = []
  for (const m of matches) {
    const u1 = regs.get(m.player1_registration_id!)!.members!.sgt_username!.toLowerCase()
    const u2 = regs.get(m.player2_registration_id!)!.members!.sgt_username!.toLowerCase()
    const id1 = idMap.get(u1)!
    const id2 = idMap.get(u2)!
    pairs.push({ userId: id1, opponentId: id2 }, { userId: id2, opponentId: id1 })
  }
  return { pairs }
}

// Starts a bracket round: lazily creates the tournament's SGT tour, creates a
// head-to-head event for the round, registers all pairings, and links the matches.
export async function startRoundAction(
  tournamentId: string,
  bracket: TournamentMatch['bracket'],
  round: number,
  input: RoundSettingsInput,
): Promise<Result> {
  try {
    await requireAdmin()
    if (!input.courseId || input.courseId < 1) return { error: 'Enter a valid SGT course ID.' }

    const tournament = await getTournamentById(tournamentId)
    if (!tournament) return { error: 'Tournament not found.' }

    const allMatches = await getRoundMatches(tournamentId, bracket, round)
    const playable = allMatches.filter(
      (m) => !m.is_bye && m.status !== 'completed' && m.player1_registration_id && m.player2_registration_id,
    )
    if (playable.length === 0) return { error: 'No matches in this round are ready to start.' }
    if (playable.some((m) => m.sgt_tournament_id)) {
      return { error: 'This round already has an SGT event. Regenerate it instead.' }
    }

    const regList = await getRegistrationsForTournament(tournamentId)
    const regs = new Map(regList.map((r) => [r.id, r]))

    const { pairs, error } = await resolvePairs(playable, regs)
    if (error) return { error }

    // Lazily create the SGT tour that represents this tournament.
    let sgtTourId = tournament.sgt_tour_id
    if (!sgtTourId) {
      sgtTourId = await createSgtTour(tournament.name)
      await setTournamentSgtTour(tournamentId, sgtTourId)
    }

    const settings = buildSettings(tournament.name, roundLabelOf(playable[0]), input)
    const sgtTournamentId = await createSgtRoundEvent(sgtTourId, settings)
    await registerRoundPlayers(sgtTournamentId, sgtTourId, pairs)
    await setRoundSgtEvent(playable.map((m) => m.id), sgtTournamentId, settings)

    revalidate(tournamentId)
    return { success: `Round started — SGT event #${sgtTournamentId} created with ${pairs.length / 2} match(es).` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to start round.' }
  }
}

// Pulls the SGT scorecards for a match's event and computes the hole-by-hole net result.
export async function resolveMatchAction(matchId: string): Promise<Result> {
  try {
    await requireAdmin()
    const match = await getMatchById(matchId)
    if (!match) return { error: 'Match not found.' }
    if (match.status === 'completed') return { error: 'This match is already resolved.' }
    if (!match.player1_registration_id || !match.player2_registration_id) {
      return { error: 'Both players must be set before resolving.' }
    }
    if (!match.sgt_tournament_id) return { error: 'Start the round (create the SGT event) first.' }

    const regList = await getRegistrationsForTournament(match.tournament_id)
    const regs = new Map(regList.map((r) => [r.id, r]))
    const u1 = regs.get(match.player1_registration_id)?.members?.sgt_username
    const u2 = regs.get(match.player2_registration_id)?.members?.sgt_username
    if (!u1 || !u2) return { error: 'Both players need an SGT username.' }

    const idMap = await resolvePlayerIds([u1, u2])
    const id1 = idMap.get(u1.toLowerCase())
    const id2 = idMap.get(u2.toLowerCase())
    if (!id1 || !id2) return { error: 'Could not resolve both players on SGT.' }

    const cards = await getScorecards(match.sgt_tournament_id)
    const p1 = playerRoundFromCards(cards, id1)
    const p2 = playerRoundFromCards(cards, id2)
    if (!p1 || !p2) return { error: 'Scores are not available yet for both players.' }

    const outcome = resolveMatch(p1, p2)
    if (outcome.needsDecision) {
      await setMatchNeedsDecision(matchId, `${outcome.summary} — needs a decision`)
      revalidate(match.tournament_id)
      return { success: 'All square after count-back — declare a winner to advance.' }
    }

    const winnerRegId =
      outcome.winner === 'p1' ? match.player1_registration_id : match.player2_registration_id
    const loserRegId = otherPlayer(match, winnerRegId)
    await completeMatch(matchId, winnerRegId, 'play', outcome.summary)
    await advance(match, winnerRegId, loserRegId)

    revalidate(match.tournament_id)
    return { success: `Result: ${regLabel(regs, winnerRegId)} — ${outcome.summary}.` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to resolve match.' }
  }
}

// Admin — award a match by forfeit.
export async function forfeitMatchAction(matchId: string, winnerRegistrationId: string): Promise<Result> {
  return declareOutcome(matchId, winnerRegistrationId, 'forfeit', 'Forfeit')
}

// Admin — manually declare a winner (e.g. after an all-square tie or dispute).
export async function declareMatchWinnerAction(matchId: string, winnerRegistrationId: string): Promise<Result> {
  return declareOutcome(matchId, winnerRegistrationId, 'admin', 'Advanced by admin')
}

async function declareOutcome(
  matchId: string,
  winnerRegistrationId: string,
  resultType: 'forfeit' | 'admin',
  summary: string,
): Promise<Result> {
  try {
    await requireAdmin()
    const match = await getMatchById(matchId)
    if (!match) return { error: 'Match not found.' }
    if (
      winnerRegistrationId !== match.player1_registration_id &&
      winnerRegistrationId !== match.player2_registration_id
    ) {
      return { error: 'Selected winner is not in this match.' }
    }
    const loserRegId = otherPlayer(match, winnerRegistrationId)
    await completeMatch(matchId, winnerRegistrationId, resultType, summary)
    await advance(match, winnerRegistrationId, loserRegId)
    revalidate(match.tournament_id)
    return { success: 'Winner recorded.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to record winner.' }
  }
}

// Admin — rename a round's SGT event (keeps the same event + registrations).
export async function renameRoundEventAction(matchId: string, newName: string): Promise<Result> {
  try {
    await requireAdmin()
    const match = await getMatchById(matchId)
    if (!match?.sgt_tournament_id || !match.sgt_settings) return { error: 'This round has no SGT event yet.' }
    const tournament = await getTournamentById(match.tournament_id)
    if (!tournament?.sgt_tour_id) return { error: 'Tournament has no SGT tour.' }

    const settings: SgtRoundSettings = { ...match.sgt_settings, tourneyname: newName.slice(0, 50) }
    await editSgtRoundEvent(match.sgt_tournament_id, tournament.sgt_tour_id, settings)
    await setRoundSgtEvent(
      (await getRoundMatches(match.tournament_id, match.bracket, match.round)).map((m) => m.id),
      match.sgt_tournament_id,
      settings,
    )
    revalidate(match.tournament_id)
    return { success: 'SGT event renamed.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to rename event.' }
  }
}

// Admin — delete and recreate a round's SGT event with new settings (re-registers players).
export async function regenerateRoundEventAction(
  matchId: string,
  input: RoundSettingsInput,
): Promise<Result> {
  try {
    await requireAdmin()
    const match = await getMatchById(matchId)
    if (!match) return { error: 'Match not found.' }
    const tournament = await getTournamentById(match.tournament_id)
    if (!tournament?.sgt_tour_id) return { error: 'Tournament has no SGT tour yet — start the round instead.' }

    const roundMatches = await getRoundMatches(match.tournament_id, match.bracket, match.round)
    const playable = roundMatches.filter(
      (m) => !m.is_bye && m.player1_registration_id && m.player2_registration_id,
    )
    const regList = await getRegistrationsForTournament(match.tournament_id)
    const regs = new Map(regList.map((r) => [r.id, r]))
    const { pairs, error } = await resolvePairs(playable, regs)
    if (error) return { error }

    if (match.sgt_tournament_id) {
      await deleteSgtRoundEvent(match.sgt_tournament_id, tournament.sgt_tour_id)
    }
    const settings = buildSettings(tournament.name, roundLabelOf(match), input)
    const newId = await createSgtRoundEvent(tournament.sgt_tour_id, settings)
    await registerRoundPlayers(newId, tournament.sgt_tour_id, pairs)
    await setRoundSgtEvent(playable.map((m) => m.id), newId, settings)

    revalidate(match.tournament_id)
    return { success: `Round regenerated — new SGT event #${newId}.` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to regenerate event.' }
  }
}
