import { createClient } from '../server'
import { createAdminClient } from '../admin'
import type { TournamentMatch } from '../types'

// A row ready to insert. Wiring pointers are already resolved to uuids by the caller.
export type NewMatchRow = {
  id: string
  tournament_id: string
  bracket: TournamentMatch['bracket']
  round: number
  position: number
  player1_registration_id: string | null
  player2_registration_id: string | null
  winner_registration_id: string | null
  is_bye: boolean
  result_type: TournamentMatch['result_type']
  status: TournamentMatch['status']
  next_match_id: string | null
  next_match_slot: 1 | 2 | null
  loser_match_id: string | null
  loser_match_slot: 1 | 2 | null
}

// Member + admin — all matches for a tournament in draw order.
export async function getMatchesForTournament(tournamentId: string): Promise<TournamentMatch[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tournament_matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('bracket', { ascending: true })
    .order('round', { ascending: true })
    .order('position', { ascending: true })
  if (error) throw new Error(`getMatchesForTournament: ${error.message}`)
  return (data ?? []) as TournamentMatch[]
}

export async function deleteMatchesForTournament(tournamentId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('tournament_matches').delete().eq('tournament_id', tournamentId)
  if (error) throw new Error(`deleteMatchesForTournament: ${error.message}`)
}

// Insert the full bracket in a single statement. The advancement pointers are
// self-referential FKs, but Postgres checks referential integrity at the end of
// the statement, so a multi-row insert that references its own rows resolves
// fine — no second pass needed.
export async function insertBracket(rows: NewMatchRow[]): Promise<void> {
  if (rows.length === 0) return
  const supabase = createAdminClient()
  const { error } = await supabase.from('tournament_matches').insert(rows)
  if (error) throw new Error(`insertBracket: ${error.message}`)
}

export async function getMatchById(id: string): Promise<TournamentMatch | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('tournament_matches').select('*').eq('id', id).single()
  if (error) return null
  return data as TournamentMatch
}

// All matches in one bracket round (a "round" = one SGT event).
export async function getRoundMatches(
  tournamentId: string,
  bracket: TournamentMatch['bracket'],
  round: number,
): Promise<TournamentMatch[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tournament_matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('bracket', bracket)
    .eq('round', round)
    .order('position', { ascending: true })
  if (error) throw new Error(`getRoundMatches: ${error.message}`)
  return (data ?? []) as TournamentMatch[]
}

// Attach a created SGT event + its settings to every match in a round, marking them scheduled.
export async function setRoundSgtEvent(
  matchIds: string[],
  sgtTournamentId: number,
  settings: TournamentMatch['sgt_settings'],
): Promise<void> {
  if (matchIds.length === 0) return
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('tournament_matches')
    .update({ sgt_tournament_id: sgtTournamentId, sgt_settings: settings, status: 'scheduled' })
    .in('id', matchIds)
  if (error) throw new Error(`setRoundSgtEvent: ${error.message}`)
}

// Record a match result (winner + summary) and mark it completed.
export async function completeMatch(
  matchId: string,
  winnerRegistrationId: string,
  resultType: NonNullable<TournamentMatch['result_type']>,
  resultSummary: string,
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('tournament_matches')
    .update({
      winner_registration_id: winnerRegistrationId,
      result_type: resultType,
      result_summary: resultSummary,
      status: 'completed',
    })
    .eq('id', matchId)
  if (error) throw new Error(`completeMatch: ${error.message}`)
}

// Record an all-square result that the admin still needs to decide (no winner set).
export async function setMatchNeedsDecision(matchId: string, summary: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('tournament_matches')
    .update({ result_summary: summary, result_type: 'play' })
    .eq('id', matchId)
  if (error) throw new Error(`setMatchNeedsDecision: ${error.message}`)
}

// Admin — set a registration into a match slot (manual move / correction).
export async function setMatchPlayer(
  matchId: string,
  slot: 1 | 2,
  registrationId: string | null,
): Promise<void> {
  const supabase = createAdminClient()
  const column = slot === 1 ? 'player1_registration_id' : 'player2_registration_id'
  const { error } = await supabase.from('tournament_matches').update({ [column]: registrationId }).eq('id', matchId)
  if (error) throw new Error(`setMatchPlayer: ${error.message}`)
}

// Admin — persist seed numbers on the registrations in a single statement via
// the set_registration_seeds RPC.
export async function setRegistrationSeeds(seeds: { id: string; seed: number }[]): Promise<void> {
  if (seeds.length === 0) return
  const supabase = createAdminClient()
  const { error } = await supabase.rpc('set_registration_seeds', { seed_pairs: seeds })
  if (error) throw new Error(`setRegistrationSeeds: ${error.message}`)
}
