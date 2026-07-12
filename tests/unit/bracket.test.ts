import { describe, it, expect } from 'vitest'
import {
  nextPowerOfTwo,
  standardSeedOrder,
  generateSingleElimination,
  generateDoubleElimination,
  type GeneratedMatch,
} from '@/lib/tournament/bracket'

function byId(matches: GeneratedMatch[]) {
  const map = new Map<number, GeneratedMatch>()
  for (const m of matches) map.set(m.localId, m)
  return map
}

// Every advancement pointer must reference a real match + valid slot.
function assertWiringIntegrity(matches: GeneratedMatch[]) {
  const map = byId(matches)
  for (const m of matches) {
    for (const w of [m.winnerTo, m.loserTo]) {
      if (w) {
        expect(map.has(w.localId), `pointer to missing match ${w.localId}`).toBe(true)
        expect([1, 2]).toContain(w.slot)
      }
    }
  }
}

describe('nextPowerOfTwo', () => {
  it('rounds up to the next power of two', () => {
    expect(nextPowerOfTwo(2)).toBe(2)
    expect(nextPowerOfTwo(3)).toBe(4)
    expect(nextPowerOfTwo(5)).toBe(8)
    expect(nextPowerOfTwo(8)).toBe(8)
    expect(nextPowerOfTwo(9)).toBe(16)
  })
})

describe('standardSeedOrder', () => {
  it('produces canonical seeding orders', () => {
    expect(standardSeedOrder(2)).toEqual([1, 2])
    expect(standardSeedOrder(4)).toEqual([1, 4, 2, 3])
    expect(standardSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6])
  })

  it('pairs the top seed against the bottom seed in round 1', () => {
    const order = standardSeedOrder(16)
    expect(order[0]).toBe(1)
    expect(order[1]).toBe(16)
  })
})

describe('generateSingleElimination', () => {
  const cases = [
    { players: 2, size: 2 },
    { players: 3, size: 4 },
    { players: 4, size: 4 },
    { players: 5, size: 8 },
    { players: 8, size: 8 },
    { players: 16, size: 16 },
  ]

  for (const { players, size } of cases) {
    describe(`${players} players`, () => {
      const matches = generateSingleElimination(players)

      it(`creates size-1 (${size - 1}) matches`, () => {
        expect(matches.length).toBe(size - 1)
      })

      it(`marks exactly ${size - players} byes, all in round 1`, () => {
        const byes = matches.filter((m) => m.isBye)
        expect(byes.length).toBe(size - players)
        for (const bye of byes) {
          expect(bye.round).toBe(1)
          expect(bye.winnerSeed).not.toBeNull()
        }
      })

      it('has exactly one final (no winnerTo)', () => {
        const finals = matches.filter((m) => m.winnerTo === null)
        expect(finals.length).toBe(1)
        expect(finals[0].round).toBe(Math.log2(size))
      })

      it('has valid wiring', () => assertWiringIntegrity(matches))

      it('never wires a loser drop (single elimination)', () => {
        expect(matches.every((m) => m.loserTo === null)).toBe(true)
      })
    })
  }

  it('seeds the top seed against the lowest real seed and gives byes to top seeds', () => {
    // 5 players in an 8 draw: seeds 6,7,8 are phantoms → seeds 1,2,3 get byes.
    const matches = generateSingleElimination(5)
    const byeWinners = matches.filter((m) => m.isBye).map((m) => m.winnerSeed).sort()
    expect(byeWinners).toEqual([1, 2, 3])
  })

  it('propagates a bye winner into its round-2 slot', () => {
    const matches = generateSingleElimination(3)
    // 3 players in a 4 draw: seed 1 gets a bye and should appear in the final already.
    const round2 = matches.filter((m) => m.round === 2)
    expect(round2.length).toBe(1)
    const finalSeeds = [round2[0].player1Seed, round2[0].player2Seed]
    expect(finalSeeds).toContain(1)
  })

  it('rejects fields smaller than 2', () => {
    expect(() => generateSingleElimination(1)).toThrow()
  })
})

describe('generateDoubleElimination', () => {
  for (const { players, size } of [
    { players: 4, size: 4 },
    { players: 8, size: 8 },
    { players: 16, size: 16 },
  ]) {
    describe(`${players} players`, () => {
      const matches = generateDoubleElimination(players)

      it(`creates 2*size-2 (${2 * size - 2}) matches`, () => {
        expect(matches.length).toBe(2 * size - 2)
      })

      it('has a winners bracket of size-1 matches', () => {
        expect(matches.filter((m) => m.bracket === 'winners').length).toBe(size - 1)
      })

      it('has a losers bracket of size-2 matches', () => {
        expect(matches.filter((m) => m.bracket === 'losers').length).toBe(size - 2)
      })

      it('has exactly one grand final', () => {
        expect(matches.filter((m) => m.bracket === 'grand_final').length).toBe(1)
      })

      it('has exactly one terminal match (the grand final)', () => {
        const terminals = matches.filter((m) => m.winnerTo === null)
        expect(terminals.length).toBe(1)
        expect(terminals[0].bracket).toBe('grand_final')
      })

      it('drops every winners-bracket loser somewhere (except the grand final feed)', () => {
        // Every winners match routes its loser into the losers bracket.
        const wb = matches.filter((m) => m.bracket === 'winners')
        expect(wb.every((m) => m.loserTo !== null)).toBe(true)
      })

      it('routes the winners final into grand-final slot 1', () => {
        const k = Math.log2(size)
        const wbFinal = matches.find((m) => m.bracket === 'winners' && m.round === k)!
        const gf = matches.find((m) => m.bracket === 'grand_final')!
        expect(wbFinal.winnerTo).toEqual({ localId: gf.localId, slot: 1 })
      })

      it('has valid wiring', () => assertWiringIntegrity(matches))
    })
  }

  it('handles a 2-player field with a losers path into the grand final', () => {
    const matches = generateDoubleElimination(2)
    expect(matches.filter((m) => m.bracket === 'grand_final').length).toBe(1)
    const wbFinal = matches.find((m) => m.bracket === 'winners')!
    expect(wbFinal.loserTo).not.toBeNull()
  })
})
