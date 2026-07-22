// Pure bracket-generation engine for match-play tournaments.
//
// The engine works entirely in terms of *seeds* (1..playerCount) and stable
// integer `localId`s so it is deterministic and unit-testable. A caller maps
// seeds → registration ids and localIds → row uuids when persisting.
//
// Advancement is expressed as `winnerTo` / `loserTo` pointers that name a
// downstream match's localId and which slot (1 or 2) the player fills. Seeds
// above `playerCount` are "phantoms" — they represent byes.

export type BracketName = 'winners' | 'losers' | 'grand_final'
export type MatchSlot = 1 | 2

export type Wiring = { localId: number; slot: MatchSlot }

export type GeneratedMatch = {
  localId: number
  bracket: BracketName
  round: number
  position: number
  // Global "phase": the concurrent play slot this match belongs to across both
  // brackets, so a whole phase can be scheduled as one round. Winners round r is
  // phase r; losers round r is phase r+1 (it follows the winners round that feeds
  // it); the grand final is phase 2k. Everything sharing a phase can be played at
  // the same time once the previous phase completes.
  phase: number
  // Known seeds for this match. null = to-be-determined (filled by advancement) or a phantom bye.
  player1Seed: number | null
  player2Seed: number | null
  isBye: boolean
  winnerSeed: number | null // preset only for round-1 byes
  winnerTo: Wiring | null
  loserTo: Wiring | null
}

export function nextPowerOfTwo(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

// Standard tournament seeding order for a bracket of `size` (a power of two).
// e.g. size 8 → [1,8,4,5,2,7,3,6]; consecutive pairs are the round-1 matchups.
export function standardSeedOrder(size: number): number[] {
  let seeds = [1]
  while (seeds.length < size) {
    const sum = seeds.length * 2 + 1
    const next: number[] = []
    for (const s of seeds) {
      next.push(s)
      next.push(sum - s)
    }
    seeds = next
  }
  return seeds
}

class MatchBuilder {
  private matches: GeneratedMatch[] = []
  private byKey = new Map<string, GeneratedMatch>()
  private nextId = 1

  key(bracket: BracketName, round: number, position: number): string {
    return `${bracket}:${round}:${position}`
  }

  create(bracket: BracketName, round: number, position: number): GeneratedMatch {
    const m: GeneratedMatch = {
      localId: this.nextId++,
      bracket,
      round,
      position,
      // Losers rounds trail their feeding winners round by one phase. The grand
      // final is re-stamped by the caller once the winners depth k is known.
      phase: bracket === 'losers' ? round + 1 : round,
      player1Seed: null,
      player2Seed: null,
      isBye: false,
      winnerSeed: null,
      winnerTo: null,
      loserTo: null,
    }
    this.matches.push(m)
    this.byKey.set(this.key(bracket, round, position), m)
    return m
  }

  get(bracket: BracketName, round: number, position: number): GeneratedMatch {
    const m = this.byKey.get(this.key(bracket, round, position))
    if (!m) throw new Error(`bracket: missing match ${bracket}:${round}:${position}`)
    return m
  }

  all(): GeneratedMatch[] {
    return this.matches
  }
}

function setSlotSeed(m: GeneratedMatch, slot: MatchSlot, seed: number | null): void {
  if (slot === 1) m.player1Seed = seed
  else m.player2Seed = seed
}

// Builds the winners bracket (rounds 1..k). Round-1 slots are seeded; later
// rounds are TBD. Byes (phantom seeds) are resolved so the real player advances.
function buildWinners(b: MatchBuilder, playerCount: number): { size: number; rounds: number } {
  const size = nextPowerOfTwo(playerCount)
  const rounds = Math.log2(size)
  const order = standardSeedOrder(size)

  // Create all winners matches.
  for (let r = 1; r <= rounds; r++) {
    const count = size / 2 ** r
    for (let p = 0; p < count; p++) b.create('winners', r, p)
  }

  // Wire winners advancement.
  for (let r = 1; r < rounds; r++) {
    const count = size / 2 ** r
    for (let p = 0; p < count; p++) {
      const m = b.get('winners', r, p)
      const target = b.get('winners', r + 1, Math.floor(p / 2))
      m.winnerTo = { localId: target.localId, slot: p % 2 === 0 ? 1 : 2 }
    }
  }

  // Seed round 1 and resolve byes.
  const r1Count = size / 2
  for (let p = 0; p < r1Count; p++) {
    const m = b.get('winners', 1, p)
    const s1 = order[2 * p]
    const s2 = order[2 * p + 1]
    m.player1Seed = s1 <= playerCount ? s1 : null
    m.player2Seed = s2 <= playerCount ? s2 : null

    const oneEmpty = (m.player1Seed === null) !== (m.player2Seed === null)
    if (oneEmpty) {
      const realSeed = m.player1Seed ?? m.player2Seed!
      m.isBye = true
      m.winnerSeed = realSeed
      // Propagate the auto-advancing player into its next winners slot.
      if (m.winnerTo) setSlotSeed(b.get('winners', 2, Math.floor(p / 2)), m.winnerTo.slot, realSeed)
    }
  }

  return { size, rounds }
}

export function generateSingleElimination(playerCount: number): GeneratedMatch[] {
  if (playerCount < 2) throw new Error('A tournament needs at least 2 players.')
  const b = new MatchBuilder()
  buildWinners(b, playerCount)
  return b.all()
}

export function generateDoubleElimination(playerCount: number): GeneratedMatch[] {
  if (playerCount < 2) throw new Error('A tournament needs at least 2 players.')
  const b = new MatchBuilder()
  const { size, rounds: k } = buildWinners(b, playerCount)

  // Grand final (no bracket reset): WB champion vs LB champion. It runs one phase
  // after the losers final, which sits at phase 2(k-1)+1 = 2k-1, so phase 2k.
  const grandFinal = b.create('grand_final', 1, 0)
  grandFinal.phase = 2 * k
  b.get('winners', k, 0).winnerTo = { localId: grandFinal.localId, slot: 1 }

  if (k === 1) {
    // 2-player field: WB final loser gets a second life directly in the grand final.
    b.get('winners', 1, 0).loserTo = { localId: grandFinal.localId, slot: 2 }
    return b.all()
  }

  // Losers bracket. Rounds alternate "major" (absorb a WB round's losers) and
  // "minor" (LB winners consolidate). LB round 1 pairs WB round-1 losers.
  let lbRound = 1
  const lb1Count = size / 4
  for (let p = 0; p < lb1Count; p++) b.create('losers', lbRound, p)
  // WB round-1 losers drop into LB round 1 (two adjacent losers per match).
  for (let p = 0; p < size / 2; p++) {
    const wb = b.get('winners', 1, p)
    wb.loserTo = { localId: b.get('losers', 1, Math.floor(p / 2)).localId, slot: p % 2 === 0 ? 1 : 2 }
  }

  let prevLbRound = lbRound
  let prevWinners = lb1Count

  for (let wbRound = 2; wbRound <= k; wbRound++) {
    // Major round: pair each surviving LB player with a loser dropping from WB `wbRound`.
    lbRound++
    const majorCount = size / 2 ** wbRound
    for (let p = 0; p < majorCount; p++) b.create('losers', lbRound, p)
    for (let p = 0; p < majorCount; p++) {
      const major = b.get('losers', lbRound, p)
      b.get('losers', prevLbRound, p).winnerTo = { localId: major.localId, slot: 1 }
      b.get('winners', wbRound, p).loserTo = { localId: major.localId, slot: 2 }
    }
    prevLbRound = lbRound
    prevWinners = majorCount

    // Minor round: LB winners play each other. The final major round is the LB final.
    if (wbRound < k) {
      lbRound++
      const minorCount = prevWinners / 2
      for (let p = 0; p < minorCount; p++) b.create('losers', lbRound, p)
      for (let p = 0; p < prevWinners; p++) {
        b.get('losers', prevLbRound, p).winnerTo = {
          localId: b.get('losers', lbRound, Math.floor(p / 2)).localId,
          slot: p % 2 === 0 ? 1 : 2,
        }
      }
      prevLbRound = lbRound
      prevWinners = minorCount
    }
  }

  // LB champion advances to the grand final.
  b.get('losers', prevLbRound, 0).winnerTo = { localId: grandFinal.localId, slot: 2 }

  return b.all()
}

export function generateBracket(
  format: 'single_elim' | 'double_elim',
  playerCount: number,
): GeneratedMatch[] {
  return format === 'single_elim'
    ? generateSingleElimination(playerCount)
    : generateDoubleElimination(playerCount)
}
