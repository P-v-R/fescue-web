import { describe, it, expect } from 'vitest'
import { findBlackout, type BlackoutPeriod } from '@/lib/utils/blackout'

function makePeriod(overrides: Partial<BlackoutPeriod> = {}): BlackoutPeriod {
  return {
    id: '1',
    date: '2026-03-26',
    start_time: null,
    end_time: null,
    all_bays: true,
    bay_ids: [],
    reason: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const BAY_A = 'bay-a'
const BAY_B = 'bay-b'

describe('findBlackout — all-day periods', () => {
  it('returns the period when all_bays=true and no time range', () => {
    const period = makePeriod({ all_bays: true, start_time: null, end_time: null })
    const slotTime = new Date(2026, 2, 26, 10, 0)
    expect(findBlackout(slotTime, BAY_A, [period])).toBe(period)
  })

  it('returns the period for a specific bay when all_bays=false and bay_id matches', () => {
    const period = makePeriod({ all_bays: false, bay_ids: [BAY_A] })
    const slotTime = new Date(2026, 2, 26, 10, 0)
    expect(findBlackout(slotTime, BAY_A, [period])).toBe(period)
  })

  it('returns null when all_bays=false and bay_id does not match', () => {
    const period = makePeriod({ all_bays: false, bay_ids: [BAY_A] })
    const slotTime = new Date(2026, 2, 26, 10, 0)
    expect(findBlackout(slotTime, BAY_B, [period])).toBeNull()
  })

  it('returns null when periods array is empty', () => {
    const slotTime = new Date(2026, 2, 26, 10, 0)
    expect(findBlackout(slotTime, BAY_A, [])).toBeNull()
  })
})

describe('findBlackout — time-ranged periods', () => {
  const period = makePeriod({
    all_bays: true,
    start_time: '10:00:00',
    end_time: '14:00:00',
  })

  it('returns the period for a slot inside the range', () => {
    const slotTime = new Date(2026, 2, 26, 10, 0) // exactly at start
    expect(findBlackout(slotTime, BAY_A, [period])).toBe(period)
  })

  it('returns the period for a slot in the middle of the range', () => {
    const slotTime = new Date(2026, 2, 26, 12, 0)
    expect(findBlackout(slotTime, BAY_A, [period])).toBe(period)
  })

  it('returns the period for the last slot before end time', () => {
    const slotTime = new Date(2026, 2, 26, 13, 30)
    expect(findBlackout(slotTime, BAY_A, [period])).toBe(period)
  })

  it('returns null for a slot at exactly the end time (exclusive)', () => {
    const slotTime = new Date(2026, 2, 26, 14, 0)
    expect(findBlackout(slotTime, BAY_A, [period])).toBeNull()
  })

  it('returns null for a slot before the range', () => {
    const slotTime = new Date(2026, 2, 26, 9, 30)
    expect(findBlackout(slotTime, BAY_A, [period])).toBeNull()
  })

  it('returns null for a slot after the range', () => {
    const slotTime = new Date(2026, 2, 26, 15, 0)
    expect(findBlackout(slotTime, BAY_A, [period])).toBeNull()
  })
})

describe('findBlackout — multiple periods', () => {
  it('returns the first matching period', () => {
    const p1 = makePeriod({ id: '1', all_bays: false, bay_ids: [BAY_B] })
    const p2 = makePeriod({ id: '2', all_bays: true })
    const slotTime = new Date(2026, 2, 26, 10, 0)
    // BAY_A doesn't match p1 but matches p2
    expect(findBlackout(slotTime, BAY_A, [p1, p2])).toBe(p2)
  })

  it('returns null when no period matches', () => {
    const p1 = makePeriod({ all_bays: false, bay_ids: [BAY_A], start_time: '10:00:00', end_time: '12:00:00' })
    const p2 = makePeriod({ all_bays: false, bay_ids: [BAY_B] })
    const slotTime = new Date(2026, 2, 26, 14, 0) // outside p1 range, wrong bay for p2
    expect(findBlackout(slotTime, BAY_A, [p1, p2])).toBeNull()
  })
})

describe('findBlackout — half-hour slot boundaries', () => {
  const period = makePeriod({
    all_bays: true,
    start_time: '09:00:00',
    end_time: '09:30:00',
  })

  it('matches the 9:00am slot', () => {
    expect(findBlackout(new Date(2026, 2, 26, 9, 0), BAY_A, [period])).toBe(period)
  })

  it('does not match the 9:30am slot (end is exclusive)', () => {
    expect(findBlackout(new Date(2026, 2, 26, 9, 30), BAY_A, [period])).toBeNull()
  })
})
