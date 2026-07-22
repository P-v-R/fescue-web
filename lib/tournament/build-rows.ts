import { generateBracket } from './bracket'
import type { NewMatchRow } from '@/lib/supabase/queries/tournament-matches'
import type { TournamentFormat } from '@/lib/supabase/types'

// Maps the pure bracket engine's seed-based output onto insertable DB rows.
// `orderedRegistrationIds[0]` is seed 1, `[1]` is seed 2, and so on. `newId`
// turns an engine localId into the uuid that row will be persisted under.
export function buildBracketRows({
  tournamentId,
  format,
  orderedRegistrationIds,
  newId,
}: {
  tournamentId: string
  format: TournamentFormat
  orderedRegistrationIds: string[]
  newId: (localId: number) => string
}): NewMatchRow[] {
  const playerCount = orderedRegistrationIds.length
  const generated = generateBracket(format, playerCount)

  const seedToReg = (seed: number | null): string | null =>
    seed != null && seed >= 1 && seed <= playerCount ? orderedRegistrationIds[seed - 1] : null

  return generated.map((m) => ({
    id: newId(m.localId),
    tournament_id: tournamentId,
    bracket: m.bracket,
    round: m.round,
    position: m.position,
    phase: m.phase,
    player1_registration_id: seedToReg(m.player1Seed),
    player2_registration_id: seedToReg(m.player2Seed),
    winner_registration_id: m.isBye ? seedToReg(m.winnerSeed) : null,
    is_bye: m.isBye,
    result_type: m.isBye ? 'bye' : null,
    status: m.isBye ? 'completed' : 'pending',
    next_match_id: m.winnerTo ? newId(m.winnerTo.localId) : null,
    next_match_slot: m.winnerTo ? m.winnerTo.slot : null,
    loser_match_id: m.loserTo ? newId(m.loserTo.localId) : null,
    loser_match_slot: m.loserTo ? m.loserTo.slot : null,
  }))
}
