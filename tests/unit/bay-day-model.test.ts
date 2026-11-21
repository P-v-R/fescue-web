import { describe, it, expect } from 'vitest'
import { buildBayDayModel } from '@/lib/utils/bay-day-model'
import { formatMemberName } from '@/lib/utils/member-name'
import type { Bay, BookingWithMember } from '@/lib/supabase/types'
import type { BlackoutPeriod } from '@/lib/utils/blackout'
import { clubDateKey, clubTimeKey } from '@/lib/utils/club-time'

// Thursday June 18 2026 — all times are local, matching generateTimeSlots.
const DAY = new Date(2026, 5, 18)
const at = (h: number, m = 0) => new Date(2026, 5, 18, h, m)

const bay1: Bay = { id: 'bay-1', name: 'Bay 1', is_active: true }
const bay2: Bay = { id: 'bay-2', name: 'Bay 2', is_active: true }
const bay3: Bay = { id: 'bay-3', name: 'Bay 3', is_active: true }
const bays = [bay1, bay2, bay3]

const ME = 'member-me'
let n = 0
function booking(
  bayId: string,
  h: number,
  m: number,
  duration: number,
  name = 'Marcus Thompson',
  opts: { memberId?: string; guests?: number; day?: Date } = {},
): BookingWithMember {
  const base = opts.day ?? DAY
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m)
  n++
  return {
    id: `b-${n}`,
    member_id: opts.memberId ?? `member-${n}`,
    bay_id: bayId,
    start_time: start.toISOString(),
    end_time: new Date(start.getTime() + duration * 60_000).toISOString(),
    duration_minutes: duration,
    guests: Array.from({ length: opts.guests ?? 0 }, (_, i) => ({ name: `Guest ${i + 1}` })),
    cancelled_at: null,
    created_at: start.toISOString(),
    members: { full_name: name },
  } as BookingWithMember
}

function blackout(
  startH: number | null,
  endH: number | null,
  overrides: Partial<BlackoutPeriod> = {},
): BlackoutPeriod {
  return {
    id: `bo-${startH}-${endH}`,
    date: clubDateKey(at(12)),
    start_time: startH === null ? null : `${clubTimeKey(at(startH))}:00`,
    end_time: endH === null ? null : `${clubTimeKey(at(endH))}:00`,
    all_bays: false,
    bay_ids: ['bay-3'],
    reason: 'League night',
    created_at: at(0).toISOString(),
    ...overrides,
  }
}

function build(args: {
  now: Date
  bookings?: BookingWithMember[]
  blackouts?: BlackoutPeriod[]
  date?: Date
  includeEarlier?: boolean
}) {
  return buildBayDayModel({
    bays,
    bookings: args.bookings ?? [],
    blackoutPeriods: args.blackouts ?? [],
    date: args.date ?? DAY,
    userId: ME,
    now: args.now,
    includeEarlier: args.includeEarlier ?? false,
  })
}

const column = (model: ReturnType<typeof build>, bayId: string) =>
  model.columns.find((c) => c.bay.id === bayId)!

describe('buildBayDayModel — today during opening hours', () => {
  it('starts the visible window at the current hour and folds earlier rows', () => {
    const model = build({ now: at(17, 40) })
    expect(model.rows[0]).toEqual(at(17, 0))
    expect(model.rows).toHaveLength(10) // 5:00pm … 9:30pm
    expect(model.earlier).toMatchObject({ from: at(8, 0), to: at(17, 0) })
    expect(model.closed).toBe(false)
  })

  it('clips a booking that started in the folded range to the window start', () => {
    const marcus = booking('bay-1', 16, 30, 120, 'Marcus Thompson', { guests: 1 })
    const model = build({ now: at(17, 40), bookings: [marcus] })
    const block = column(model, 'bay-1').blocks[0]
    expect(block).toMatchObject({
      kind: 'booking',
      rowStart: 0,
      span: 3,
      clippedStart: true,
      shortName: 'Marcus T.',
      guestCount: 1,
      mine: false,
    })
  })

  it('shows the current occupant with their end time in the now status', () => {
    const marcus = booking('bay-1', 16, 30, 120, 'Marcus Thompson', { guests: 1 })
    const model = build({ now: at(17, 40), bookings: [marcus] })
    expect(column(model, 'bay-1').now).toEqual({
      kind: 'occupied',
      shortName: 'Marcus T.',
      mine: false,
      until: at(18, 30),
    })
  })

  it('shows Open until the next booking for a free bay', () => {
    const ellie = booking('bay-2', 18, 0, 90, 'Ellie Watson')
    const model = build({ now: at(17, 40), bookings: [ellie] })
    expect(column(model, 'bay-2').now).toEqual({ kind: 'open', until: at(18, 0) })
  })

  it('shows Open with no end for a bay free the rest of the day', () => {
    const model = build({ now: at(17, 40) })
    expect(column(model, 'bay-2').now).toEqual({ kind: 'open', until: null })
  })

  it('shows a blackout status, not Open, for an empty bay under a partial blackout', () => {
    const model = build({ now: at(17, 40), blackouts: [blackout(17, 21)] })
    expect(column(model, 'bay-3').now).toEqual({ kind: 'blackout', reason: 'League night' })
    const blackoutBlocks = column(model, 'bay-3').blocks.filter((b) => b.kind === 'blackout')
    // 5:00 and 5:30 are already past; 6:00–8:30 is one merged blackout block
    expect(blackoutBlocks).toEqual([
      { kind: 'blackout', rowStart: 2, span: 6, reason: 'League night' },
    ])
  })

  it('marks slots before now as past and later free slots as open', () => {
    const model = build({ now: at(17, 40) })
    const blocks = column(model, 'bay-2').blocks
    expect(blocks[0]).toMatchObject({ kind: 'past', rowStart: 0 })
    expect(blocks[1]).toMatchObject({ kind: 'past', rowStart: 1 })
    expect(blocks[2]).toMatchObject({ kind: 'open', rowStart: 2, slotTime: at(18, 0) })
  })

  it('counts bookings that start in the folded range, including one cut at the boundary', () => {
    const model = build({
      now: at(17, 40),
      bookings: [
        booking('bay-1', 9, 0, 60),
        booking('bay-2', 12, 30, 60),
        booking('bay-1', 16, 30, 120),
        booking('bay-3', 17, 0, 60),
      ],
    })
    expect(model.earlier?.bookingCount).toBe(3)
  })

  it('returns the full day when earlier rows are expanded', () => {
    const model = build({ now: at(17, 40), includeEarlier: true })
    expect(model.rows[0]).toEqual(at(8, 0))
    expect(model.rows).toHaveLength(28)
    expect(model.earlier).not.toBeNull()
  })

  it('places the now line by minutes from the top of the window', () => {
    expect(build({ now: at(17, 40) }).nowMinutes).toBe(40)
  })

  it('flags the member’s own booking as mine', () => {
    const mine = booking('bay-1', 19, 0, 60, 'Perry V', { memberId: ME })
    const other = booking('bay-2', 19, 0, 60, 'Ellie Watson')
    const model = build({ now: at(17, 40), bookings: [mine, other] })
    expect(column(model, 'bay-1').blocks.find((b) => b.kind === 'booking')).toMatchObject({ mine: true })
    expect(column(model, 'bay-2').blocks.find((b) => b.kind === 'booking')).toMatchObject({ mine: false })
  })
})

describe('buildBayDayModel — outside opening hours and other days', () => {
  it('folds the whole day and hides now after closing', () => {
    const model = build({ now: at(22, 15), bookings: [booking('bay-1', 9, 0, 60)] })
    expect(model.closed).toBe(true)
    expect(model.rows).toHaveLength(0)
    expect(model.earlier).toMatchObject({ from: at(8, 0), to: at(22, 0), bookingCount: 1 })
    expect(model.nowMinutes).toBeNull()
    expect(model.columns.every((c) => c.now === null)).toBe(true)
  })

  it('shows the full day with no now status before opening', () => {
    const model = build({ now: at(7, 30) })
    expect(model.rows[0]).toEqual(at(8, 0))
    expect(model.rows).toHaveLength(28)
    expect(model.earlier).toBeNull()
    expect(model.nowMinutes).toBeNull()
    expect(model.columns.every((c) => c.now === null)).toBe(true)
  })

  it('shows the full day with nothing folded on a future date', () => {
    const tomorrow = new Date(2026, 5, 19)
    const model = build({ now: at(17, 40), date: tomorrow })
    expect(model.rows).toHaveLength(28)
    expect(model.earlier).toBeNull()
    expect(model.nowMinutes).toBeNull()
    expect(model.columns.every((c) => c.now === null)).toBe(true)
    expect(column(model, 'bay-1').blocks.every((b) => b.kind === 'open')).toBe(true)
  })

  it('turns every slot into blackout for a full-day all-bays blackout', () => {
    const tomorrow = new Date(2026, 5, 19)
    const fullDay = blackout(null, null, {
      date: clubDateKey(new Date(2026, 5, 19, 12)),
      all_bays: true,
      reason: 'Club closed',
    })
    const model = build({ now: at(17, 40), date: tomorrow, blackouts: [fullDay] })
    for (const col of model.columns) {
      expect(col.blocks).toEqual([{ kind: 'blackout', rowStart: 0, span: 28, reason: 'Club closed' }])
    }
  })
})

describe('formatMemberName', () => {
  it('shortens to first name and last initial', () => {
    expect(formatMemberName('Marcus Thompson')).toBe('Marcus T.')
  })

  it('uses the last word for the initial', () => {
    expect(formatMemberName('Mary Ann Smith')).toBe('Mary S.')
  })

  it('keeps a single name as is', () => {
    expect(formatMemberName('Cher')).toBe('Cher')
  })

  it('falls back to Member when missing', () => {
    expect(formatMemberName(null)).toBe('Member')
  })
})
