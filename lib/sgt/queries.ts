import { sgtFetch } from './client'
import type {
  SgtTour,
  SgtTournament,
  SgtStandingsEntry,
  SgtScorecard,
  SgtLeaderboardRow,
} from './types'

export async function getTours(): Promise<SgtTour[]> {
  const data = await sgtFetch('/tours/list')
  return Array.isArray(data) ? (data as SgtTour[]) : []
}

export async function getTournaments(tourId: number): Promise<SgtTournament[]> {
  const data = await sgtFetch('/tournaments/list', { tourId: String(tourId) })
  if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: SgtTournament[] }).results
  }
  return []
}

export async function getStandings(
  tourId: number,
  type: 'gross' | 'net',
): Promise<SgtStandingsEntry[]> {
  const data = await sgtFetch('/tours/standings', { tourId: String(tourId), grossOrNet: type })
  return Array.isArray(data) ? (data as SgtStandingsEntry[]) : []
}

function buildLeaderboard(
  scorecards: SgtScorecard[],
  sortBy: 'gross' | 'net',
): SgtLeaderboardRow[] {
  const playerMap = new Map<number, SgtLeaderboardRow>()

  for (const card of scorecards) {
    if (!playerMap.has(card.playerId)) {
      playerMap.set(card.playerId, {
        position: 0,
        player_name: card.player_name,
        user_has_avatar: card.user_has_avatar,
        hcp_index: card.hcp_index,
        rounds: [],
        total_gross: 0,
        total_net: 0,
        toPar_gross: 0,
        toPar_net: 0,
      })
    }
    const row = playerMap.get(card.playerId)!
    row.rounds.push({
      round: card.round,
      total_gross: card.total_gross,
      total_net: card.total_net,
      toPar_gross: card.toPar_gross,
      toPar_net: card.toPar_net,
    })
    row.total_gross += card.total_gross
    row.total_net += card.total_net
    row.toPar_gross += card.toPar_gross
    row.toPar_net += card.toPar_net
  }

  const rows = Array.from(playerMap.values())
  rows.sort((a, b) =>
    sortBy === 'gross' ? a.toPar_gross - b.toPar_gross : a.toPar_net - b.toPar_net,
  )
  rows.forEach((row, i) => { row.position = i + 1 })
  return rows
}

// Fetches scorecards once (they contain both gross and net) and returns both leaderboards.
export async function getEventLeaderboards(
  tournamentId: number,
): Promise<{ gross: SgtLeaderboardRow[]; net: SgtLeaderboardRow[] }> {
  const scorecards = (await sgtFetch('/tournaments/scorecards', {
    tournamentId: String(tournamentId),
  })) as SgtScorecard[]

  if (!Array.isArray(scorecards) || scorecards.length === 0) {
    return { gross: [], net: [] }
  }

  return {
    gross: buildLeaderboard(scorecards, 'gross'),
    net: buildLeaderboard(scorecards, 'net'),
  }
}
