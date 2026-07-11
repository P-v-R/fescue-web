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

// Insert the full bracket. FKs are self-referential, so insert without the
// pointer columns first, then patch them in — avoids ordering constraints.
export async function insertBracket(rows: NewMatchRow[]): Promise<void> {
  const supabase = createAdminClient()

  const base = rows.map((r) => ({
    id: r.id,
    tournament_id: r.tournament_id,
    bracket: r.bracket,
    round: r.round,
    position: r.position,
    player1_registration_id: r.player1_registration_id,
    player2_registration_id: r.player2_registration_id,
    winner_registration_id: r.winner_registration_id,
    is_bye: r.is_bye,
    result_type: r.result_type,
    status: r.status,
  }))

  const { error: insertError } = await supabase.from('tournament_matches').insert(base)
  if (insertError) throw new Error(`insertBracket insert: ${insertError.message}`)

  // Second pass: wire advancement pointers now that every row exists.
  for (const r of rows) {
    if (r.next_match_id == null && r.loser_match_id == null) continue
    const { error } = await supabase
      .from('tournament_matches')
      .update({
        next_match_id: r.next_match_id,
        next_match_slot: r.next_match_slot,
        loser_match_id: r.loser_match_id,
        loser_match_slot: r.loser_match_slot,
      })
      .eq('id', r.id)
    if (error) throw new Error(`insertBracket wire: ${error.message}`)
  }
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

// Admin — persist seed numbers on the registrations (batched).
export async function setRegistrationSeeds(seeds: { id: string; seed: number }[]): Promise<void> {
  const supabase = createAdminClient()
  for (const { id, seed } of seeds) {
    const { error } = await supabase.from('tournament_registrations').update({ seed }).eq('id', id)
    if (error) throw new Error(`setRegistrationSeeds: ${error.message}`)
  }
}
