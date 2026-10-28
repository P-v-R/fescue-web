import { describe, it, expect, vi, afterEach } from 'vitest'
import { findBlackout, findBlackoutInRange, type BlackoutPeriod } from '@/lib/utils/blackout'
import { clubDateKey } from '@/lib/utils/club-time'

// Regression tests for the Oct 2026 report: a whole-club 5pm–10pm blackout
// vanished at 5pm Pacific and a member booked into it at 5:15pm.
// Instants are written with explicit offsets so these tests mean the same
// thing whether the process runs in Pacific (dev Macs) or UTC (CI, Railway).

const BAY = 'bay-a'

const eveningBlackout: BlackoutPeriod = {
  id: 'evening',
  date: '2026-10-17',
  start_time: '17:00:00',
  end_time: '22:00:00',
  all_bays: true,
  bay_ids: [],
  reason: 'Private event',
  created_at: '2026-10-10T00:00:00Z',
}

afterEach(() => {
  vi.useRealTimers()
})

describe('clubDateKey — "today" is the club’s date, not UTC', () => {
  it('is still Oct 17 at 5:15pm Pacific (00:15 UTC on Oct 18)', () => {
    expect(clubDateKey(new Date('2026-10-18T00:15:00Z'))).toBe('2026-10-17')
  })

  it('is still Oct 17 at 11:59pm Pacific', () => {
    expect(clubDateKey(new Date('2026-10-17T23:59:00-07:00'))).toBe('2026-10-17')
  })

  it('rolls over at Pacific midnight', () => {
    expect(clubDateKey(new Date('2026-10-18T00:00:00-07:00'))).toBe('2026-10-18')
  })

  it('handles standard time (PST, UTC-8) in winter', () => {
    // 4:30pm PST on Jan 15 = 00:30 UTC Jan 16
    expect(clubDateKey(new Date('2026-01-16T00:30:00Z'))).toBe('2026-01-15')
  })
})

describe('findBlackout — evaluates slots in club time regardless of server TZ', () => {
  it('blocks the 7:00pm Pacific slot (02:00 UTC next day)', () => {
    const sevenPm = new Date('2026-10-17T19:00:00-07:00')
    expect(findBlackout(sevenPm, BAY, [eveningBlackout])).toBe(eveningBlackout)
  })

  it('blocks the 5:00pm Pacific slot (exact start, 00:00 UTC next day)', () => {
    const fivePm = new Date('2026-10-17T17:00:00-07:00')
    expect(findBlackout(fivePm, BAY, [eveningBlackout])).toBe(eveningBlackout)
  })

  it('allows the 4:30pm Pacific slot before the blackout', () => {
    const fourThirty = new Date('2026-10-17T16:30:00-07:00')
    expect(findBlackout(fourThirty, BAY, [eveningBlackout])).toBeNull()
  })

  it('does not leak the blackout onto the next morning (UTC date of 7pm slot)', () => {
    const nextMorning = new Date('2026-10-18T10:00:00-07:00')
    expect(findBlackout(nextMorning, BAY, [eveningBlackout])).toBeNull()
  })
})

describe('findBlackoutInRange — bookings that run into a blackout', () => {
  it('blocks a 4:00pm 2-hour booking that overlaps a 5pm blackout', () => {
    const start = new Date('2026-10-17T16:00:00-07:00')
    expect(findBlackoutInRange(start, 120, BAY, [eveningBlackout])).toBe(eveningBlackout)
  })

  it('allows a 4:00pm 1-hour booking that ends exactly at the blackout start', () => {
    const start = new Date('2026-10-17T16:00:00-07:00')
    expect(findBlackoutInRange(start, 60, BAY, [eveningBlackout])).toBeNull()
  })

  it('blocks a booking that starts inside the blackout', () => {
    const start = new Date('2026-10-17T19:00:00-07:00')
    expect(findBlackoutInRange(start, 60, BAY, [eveningBlackout])).toBe(eveningBlackout)
  })
})
