import { sgtFetch, sgtPost } from './client'
import type { SgtClubMember, SgtRawScorecard } from './types'
import type { HoleScore } from '@/lib/tournament/matchplay'
import type { SgtRoundSettings } from '@/lib/supabase/types'

// ─── Club members / player-id resolution ────────────────────────────────────

export async function getClubMembers(): Promise<SgtClubMember[]> {
  const data = await sgtFetch('/members/list')
  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as { members?: unknown })?.members)
      ? (data as { members: unknown[] }).members
      : []
  return (rows as SgtClubMember[]).filter((m) => m && m.user_name != null && m.user_id != null)
}

// Maps lowercased SGT usernames → numeric user_id (the playerId used everywhere).
export async function resolvePlayerIds(usernames: string[]): Promise<Map<string, number>> {
  const wanted = new Set(usernames.map((u) => u.toLowerCase()))
  const members = await getClubMembers()
  const map = new Map<string, number>()
  for (const m of members) {
    const key = m.user_name.toLowerCase()
    if (wanted.has(key)) map.set(key, m.user_id)
  }
  return map
}

// ─── Scorecards → hole scores ────────────────────────────────────────────────

export async function getScorecards(sgtTournamentId: number): Promise<SgtRawScorecard[]> {
  const data = await sgtFetch('/tournaments/scorecards', { tournamentId: String(sgtTournamentId) })
  return Array.isArray(data) ? (data as SgtRawScorecard[]) : []
}

// Parses a raw scorecard's per-hole fields into the engine's HoleScore[].
// Reads hole{N}_gross for the score and h{N}_index for the stroke index.
export function toHoleScores(card: SgtRawScorecard): HoleScore[] {
  const holes: HoleScore[] = []
  for (let i = 1; i <= 18; i++) {
    holes.push({
      hole: i,
      gross: Number(card[`hole${i}_gross`] ?? 0) || 0,
      strokeIndex: Number(card[`h${i}_index`] ?? i) || i,
    })
  }
  return holes
}

export type SgtPlayerRound = { hcp: number; holes: HoleScore[] }

// Finds a player's round in a set of scorecards. When a player has multiple
// scorecards (multi-round events), the first is used — match-play events are 1 round.
export function playerRoundFromCards(
  cards: SgtRawScorecard[],
  playerId: number,
): SgtPlayerRound | null {
  const card = cards.find((c) => Number(c.playerId) === playerId)
  if (!card) return null
  return { hcp: Number(card.hcp_index) || 0, holes: toHoleScores(card) }
}

// ─── Tour / event / registration writes ──────────────────────────────────────

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Creates the SGT tour that represents a whole Fescue tournament. Returns tourId.
export async function createSgtTour(name: string): Promise<number> {
  const now = new Date()
  const end = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
  const res = await sgtPost('/tours/create', {
    tourname: name.slice(0, 50),
    startdate: ymd(now),
    enddate: ymd(end),
    active: 1,
    tourtype: 0, // individual
    tourpublic: 0,
  })
  const tourId = Number(res.tourId ?? res.tourid)
  if (!tourId) throw new Error('SGT tour creation returned no tourId')
  return tourId
}

// Non-course settings default to sane values; the documented enums for
// firmness/pins/wind aren't exhaustive, so these are conservative choices.
const ROUND_DEFAULTS = {
  registrationon: 1,
  statson: 1,
  clubcombo: 1,
  points: 'Tour',
  gameplay: 'Normal',
  stableford: 0,
  head2head: 1,
  hideleaderboard: 0,
  skins: 0,
  mulligans: 0,
  attempts: 0,
  green1firmness: 'Normal',
  fairway1firmness: 'Normal',
  pins1: 'Normal',
  wind1: 'Calm',
} as const

function roundEventBody(tourId: number, settings: SgtRoundSettings) {
  const now = new Date()
  const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  return {
    tourId,
    tourneyname: settings.tourneyname.slice(0, 50),
    numberrounds: 1,
    numberholes: settings.numberholes,
    gimmes: settings.gimmes,
    puttingmode: settings.puttingmode,
    course1select: settings.courseId,
    green1speed: settings.greenspeed,
    tees1: settings.tees,
    regstartdate: ymd(now),
    regenddate: ymd(end),
    startdate: ymd(now),
    enddate: ymd(end),
    ...ROUND_DEFAULTS,
  }
}

// Creates a head-to-head SGT event for a bracket round. Returns tournamentId.
export async function createSgtRoundEvent(tourId: number, settings: SgtRoundSettings): Promise<number> {
  const res = await sgtPost('/tournaments/create', roundEventBody(tourId, settings))
  const id = Number(res.tournamentId ?? res.tournamentid)
  if (!id) throw new Error('SGT event creation returned no tournamentId')
  return id
}

// Renames / regenerates settings on an existing event (SGT edit resends all fields).
export async function editSgtRoundEvent(
  sgtTournamentId: number,
  tourId: number,
  settings: SgtRoundSettings,
): Promise<void> {
  await sgtPost('/tournaments/edit', {
    tournamentId: sgtTournamentId,
    ...roundEventBody(tourId, settings),
  })
}

export async function deleteSgtRoundEvent(sgtTournamentId: number, tourId: number): Promise<void> {
  await sgtPost('/tournaments/delete', { tournamentId: sgtTournamentId, tourId })
}

// Registers a round's players, pairing them head-to-head via opponent_id.
export async function registerRoundPlayers(
  sgtTournamentId: number,
  tourId: number,
  pairs: { userId: number; opponentId: number }[],
): Promise<void> {
  await sgtPost('/registrations/register-members', {
    tournamentId: sgtTournamentId,
    tourId,
    registrationList: pairs.map((p) => ({
      user_id: p.userId,
      useComboCap: 'true',
      opponent_id: p.opponentId,
    })),
  })
}
