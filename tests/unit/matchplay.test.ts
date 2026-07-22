import { describe, it, expect } from 'vitest'
import { resolveMatch, type MatchPlayer, type HoleScore } from '@/lib/tournament/matchplay'

// Build a player. `gross` is per-hole gross (index 0 = hole 1). Stroke index
// defaults to the hole number (SI 1 = hole 1, hardest) unless `si` is given.
function player(hcp: number, gross: number[], si?: number[]): MatchPlayer {
  const holes: HoleScore[] = gross.map((g, i) => ({
    hole: i + 1,
    gross: g,
    strokeIndex: si ? si[i] : i + 1,
  }))
  return { hcp, holes }
}

const par4x18 = (v: number) => Array(18).fill(v)

describe('resolveMatch', () => {
  it('scratch match — better gross wins every hole and closes out', () => {
    const p1 = player(0, par4x18(4))
    const p2 = player(0, par4x18(5))
    const r = resolveMatch(p1, p2)
    expect(r.winner).toBe('p1')
    // p1 up 10 after 10 holes with 8 to play → 10 & 8
    expect(r.summary).toBe('10 & 8')
    expect(r.thru).toBe(10)
  })

  it('closes out 3 & 2', () => {
    // p1 wins holes 1-3, halves the rest → 3 up with 2 to play after hole 16.
    const g1 = par4x18(4)
    const g2 = par4x18(4)
    g1[0] = 3; g1[1] = 3; g1[2] = 3
    const r = resolveMatch(player(0, g1), player(0, g2))
    expect(r.winner).toBe('p1')
    expect(r.summary).toBe('3 & 2')
    expect(r.thru).toBe(16)
  })

  it('all square with no separation → needs admin decision', () => {
    const r = resolveMatch(player(0, par4x18(4)), player(0, par4x18(4)))
    expect(r.winner).toBe('halved')
    expect(r.summary).toBe('All square')
    expect(r.thru).toBe(18)
    expect(r.needsDecision).toBe(true)
  })

  it('breaks an all-square match on count-back (better back nine)', () => {
    // p2 wins holes 1-3, p1 wins holes 16-18, rest halved → level after 18,
    // but p1 is better over the last 9 → wins on count-back.
    const g1 = par4x18(4)
    const g2 = par4x18(4)
    g2[0] = 3; g2[1] = 3; g2[2] = 3 // p2 takes the first three
    g1[15] = 3; g1[16] = 3; g1[17] = 3 // p1 takes the last three
    const r = resolveMatch(player(0, g1), player(0, g2))
    expect(r.winner).toBe('p1')
    expect(r.needsDecision).toBe(false)
    expect(r.summary).toContain('count-back')
  })

  it('won on the 18th reads "1 up", not "1 & 0"', () => {
    const g1 = par4x18(4)
    const g2 = par4x18(4)
    g1[17] = 3 // p1 wins the last hole only
    const r = resolveMatch(player(0, g1), player(0, g2))
    expect(r.winner).toBe('p1')
    expect(r.summary).toBe('1 up')
    expect(r.thru).toBe(18)
  })

  it('applies 100% allowance — strokes flip holes for the higher handicap', () => {
    // Both shoot level 4s. p2 gets 6 strokes (SI 1-6) → wins those 6 net.
    const g = par4x18(4)
    const r = resolveMatch(player(0, [...g]), player(6, [...g]))
    // p2 wins holes 1-6 on strokes, then halves; the 6-up lead closes out
    // once only 5 holes remain (after hole 13) → 6 & 5.
    expect(r.winner).toBe('p2')
    expect(r.summary).toBe('6 & 5')
  })

  it('does not give strokes when handicaps are equal', () => {
    const g1 = par4x18(4)
    const g2 = par4x18(4)
    g1[0] = 3 // p1 wins hole 1 on gross; no strokes for anyone
    const r = resolveMatch(player(5, g1), player(5, g2))
    expect(r.winner).toBe('p1')
    expect(r.summary).toBe('1 up')
  })

  it('allocates a second stroke when the difference exceeds 18', () => {
    // diff 22 → SI 1-4 get 2 strokes, SI 5-18 get 1. p1 (higher hcp) gets them.
    // Give p2 a 2-shot gross lead on the SI-1 hole; p1 still wins it net (2 strokes).
    const g1 = par4x18(4)
    const g2 = par4x18(4)
    g1[0] = 6 // hole 1 (SI 1): p1 gross 6, p2 gross 4 → net 6-2=4 vs 4 → halved
    const r = resolveMatch(player(22, g1), player(0, g2))
    // Every other hole (equal gross) p1 gets ≥1 stroke → wins. Closes out fast.
    expect(r.winner).toBe('p1')
  })

  it('ignores holes not completed by both players', () => {
    // Only holes 1-9 played; 10-18 are 0 gross for both.
    const g1 = [...par4x18(4)]
    const g2 = [...par4x18(4)]
    for (let i = 9; i < 18; i++) { g1[i] = 0; g2[i] = 0 }
    g1[0] = 3 // p1 wins hole 1
    const r = resolveMatch(player(0, g1), player(0, g2))
    expect(r.thru).toBe(9)
    expect(r.winner).toBe('p1')
    expect(r.summary).toBe('1 up') // 1 up through 9 (all that were played)
  })

  it('returns halved when no holes were played', () => {
    const r = resolveMatch(player(0, par4x18(0)), player(0, par4x18(0)))
    expect(r.winner).toBe('halved')
    expect(r.thru).toBe(0)
  })
})
