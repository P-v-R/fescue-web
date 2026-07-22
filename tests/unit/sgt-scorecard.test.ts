import { describe, it, expect } from 'vitest'
import { toHoleScores, playerRoundFromCards } from '@/lib/sgt/matches'
import type { SgtRawScorecard } from '@/lib/sgt/types'

// Builds a raw scorecard with per-hole gross + stroke index fields.
function rawCard(playerId: number, gross: number[], index: number[], hcp = 0): SgtRawScorecard {
  const card: SgtRawScorecard = {
    playerId,
    player_name: `Player ${playerId}`,
    hcp_index: hcp,
    round: 1,
    total_gross: gross.reduce((a, b) => a + b, 0),
    total_net: 0,
  }
  for (let i = 1; i <= 18; i++) {
    card[`hole${i}_gross`] = gross[i - 1]
    card[`h${i}_index`] = index[i - 1]
  }
  return card
}

describe('toHoleScores', () => {
  it('maps hole{N}_gross and h{N}_index into 18 HoleScores', () => {
    const gross = Array.from({ length: 18 }, (_, i) => 4 + (i % 2))
    const index = Array.from({ length: 18 }, (_, i) => i + 1)
    const holes = toHoleScores(rawCard(1, gross, index))
    expect(holes).toHaveLength(18)
    expect(holes[0]).toEqual({ hole: 1, gross: 4, strokeIndex: 1 })
    expect(holes[17]).toEqual({ hole: 18, gross: gross[17], strokeIndex: 18 })
  })

  it('treats missing/blank gross as 0', () => {
    const card: SgtRawScorecard = {
      playerId: 1, player_name: 'x', hcp_index: 0, round: 1, total_gross: 0, total_net: 0,
    }
    const holes = toHoleScores(card)
    expect(holes.every((h) => h.gross === 0)).toBe(true)
    // Falls back to hole number for stroke index when absent.
    expect(holes[4].strokeIndex).toBe(5)
  })
})

describe('playerRoundFromCards', () => {
  const cards = [
    rawCard(101, Array(18).fill(4), Array.from({ length: 18 }, (_, i) => i + 1), 6),
    rawCard(202, Array(18).fill(5), Array.from({ length: 18 }, (_, i) => i + 1), 2),
  ]

  it('finds a player by id and carries their handicap', () => {
    const r = playerRoundFromCards(cards, 202)
    expect(r).not.toBeNull()
    expect(r!.hcp).toBe(2)
    expect(r!.holes[0].gross).toBe(5)
  })

  it('returns null when the player is absent', () => {
    expect(playerRoundFromCards(cards, 999)).toBeNull()
  })
})
