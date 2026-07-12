// Pure hole-by-hole net match-play resolver.
//
// Singles match play, 100% handicap allowance: the lower-handicap player plays
// off scratch; the higher-handicap player receives the difference in strokes,
// allocated to the hardest holes by stroke index. Net score per hole decides
// the hole; the match is won when a player's lead exceeds the holes remaining.

export type HoleScore = {
  hole: number // 1..18
  gross: number // 0 = not played
  strokeIndex: number // 1..18 (hardest = 1)
}

export type MatchPlayer = {
  hcp: number
  holes: HoleScore[]
}

export type MatchOutcome = {
  winner: 'p1' | 'p2' | 'halved'
  summary: string // e.g. "3 & 2", "1 up", "All square", "Won on count-back"
  holesUp: number // absolute margin at the deciding point (0 if halved)
  thru: number // holes played when decided
  needsDecision: boolean // true when still tied after count-back — admin must decide
}

// Strokes the receiver gets on a hole with the given stroke index, for a total
// allowance of `strokesGiven` spread across an 18-hole index (handles > 18).
function strokesOnHole(strokeIndex: number, strokesGiven: number): number {
  if (strokesGiven <= 0) return 0
  const base = Math.floor(strokesGiven / 18)
  const remainder = strokesGiven % 18
  return base + (strokeIndex <= remainder ? 1 : 0)
}

export function resolveMatch(p1: MatchPlayer, p2: MatchPlayer): MatchOutcome {
  const byHole1 = new Map(p1.holes.map((h) => [h.hole, h]))
  const byHole2 = new Map(p2.holes.map((h) => [h.hole, h]))

  // Only holes both players actually completed (gross > 0) count.
  const holes = [...byHole1.keys()]
    .filter((n) => {
      const a = byHole1.get(n)
      const b = byHole2.get(n)
      return a && b && a.gross > 0 && b.gross > 0
    })
    .sort((a, b) => a - b)

  const n = holes.length
  if (n === 0) {
    return { winner: 'halved', summary: 'No holes played', holesUp: 0, thru: 0, needsDecision: true }
  }

  // 100% allowance: higher hcp receives the rounded difference; lower plays scratch.
  const diff = Math.round(Math.abs(p1.hcp - p2.hcp))
  const receiver: 'p1' | 'p2' | null = diff === 0 ? null : p1.hcp > p2.hcp ? 'p1' : 'p2'

  // Net score per hole, in play order — reused for the running match and count-back.
  const nets = holes.map((holeNum) => {
    const h1 = byHole1.get(holeNum)!
    const h2 = byHole2.get(holeNum)!
    const si = h1.strokeIndex
    return {
      net1: h1.gross - (receiver === 'p1' ? strokesOnHole(si, diff) : 0),
      net2: h2.gross - (receiver === 'p2' ? strokesOnHole(si, diff) : 0),
    }
  })

  let score = 0 // + = p1 ahead, - = p2 ahead
  let thru = 0

  for (const { net1, net2 } of nets) {
    if (net1 < net2) score += 1
    else if (net2 < net1) score -= 1

    thru += 1
    const remaining = n - thru
    // Match closes out only while holes remain and the lead is unbeatable.
    if (remaining > 0 && Math.abs(score) > remaining) {
      return {
        winner: score > 0 ? 'p1' : 'p2',
        summary: `${Math.abs(score)} & ${remaining}`,
        holesUp: Math.abs(score),
        thru,
        needsDecision: false,
      }
    }
  }

  if (score !== 0) {
    return {
      winner: score > 0 ? 'p1' : 'p2',
      summary: `${Math.abs(score)} up`,
      holesUp: Math.abs(score),
      thru: n,
      needsDecision: false,
    }
  }

  // All square → USGA count-back on net totals over the last 9, 6, 3, then 1 holes.
  for (const k of [9, 6, 3, 1]) {
    if (k > n) continue
    const slice = nets.slice(n - k)
    const sum1 = slice.reduce((s, h) => s + h.net1, 0)
    const sum2 = slice.reduce((s, h) => s + h.net2, 0)
    if (sum1 !== sum2) {
      return {
        winner: sum1 < sum2 ? 'p1' : 'p2',
        summary: `Won on count-back (last ${k})`,
        holesUp: 0,
        thru: n,
        needsDecision: false,
      }
    }
  }

  // Still tied after count-back — admin must decide.
  return { winner: 'halved', summary: 'All square', holesUp: 0, thru: n, needsDecision: true }
}
