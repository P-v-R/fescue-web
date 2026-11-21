import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { MobileBayTimeline } from '@/components/reservations/mobile-bay-timeline'
import type { Bay, BookingWithMember } from '@/lib/supabase/types'
import type { BlackoutPeriod } from '@/lib/utils/blackout'
import { clubDateKey, clubTimeKey } from '@/lib/utils/club-time'

// Thursday June 18 2026, 5:40 PM
const NOW = new Date(2026, 5, 18, 17, 40)
const TODAY = new Date(2026, 5, 18)
const at = (h: number, m = 0) => new Date(2026, 5, 18, h, m)

const bay1: Bay = { id: 'bay-1', name: 'Bay 1', is_active: true }
const bay2: Bay = { id: 'bay-2', name: 'Bay 2', is_active: true }
const bay3: Bay = { id: 'bay-3', name: 'Bay 3', is_active: true }
const bigBay: Bay = { id: 'big-bay', name: 'Big Bay', is_active: true }
const bays = [bay1, bay2, bay3, bigBay]

const ME = 'member-me'
let n = 0
function booking(
  bayId: string,
  h: number,
  m: number,
  duration: number,
  name: string,
  opts: { memberId?: string; guests?: number } = {},
): BookingWithMember {
  const start = at(h, m)
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

const marcus = booking('bay-1', 16, 30, 120, 'Marcus Thompson', { guests: 1 })
const mine = booking('bay-1', 19, 0, 60, 'Perry V', { memberId: ME })
const ellie = booking('bay-2', 18, 0, 90, 'Ellie Watson')
const morning = booking('bay-3', 9, 0, 60, 'Dan Price')

const league: BlackoutPeriod = {
  id: 'league',
  date: clubDateKey(at(12)),
  start_time: `${clubTimeKey(at(20))}:00`,
  end_time: `${clubTimeKey(at(21))}:00`,
  all_bays: false,
  bay_ids: ['bay-3'],
  reason: 'League night',
  created_at: at(0).toISOString(),
}

function setup(overrides: { date?: Date; bookings?: BookingWithMember[] } = {}) {
  const onSlotClick = vi.fn()
  const onBookingClick = vi.fn()
  render(
    <MobileBayTimeline
      bays={bays}
      bookings={overrides.bookings ?? [marcus, mine, ellie, morning]}
      date={overrides.date ?? TODAY}
      userId={ME}
      blackoutPeriods={[league]}
      onSlotClick={onSlotClick}
      onBookingClick={onBookingClick}
    />,
  )
  return { onSlotClick, onBookingClick }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('MobileBayTimeline', () => {
  it('shows each bay name once in the pinned header', () => {
    setup()
    const header = screen.getByTestId('bay-header')
    for (const bay of bays) {
      expect(within(header).getAllByText(bay.name)).toHaveLength(1)
    }
  })

  it('shows who is on each bay right now', () => {
    setup()
    const nowRow = screen.getByTestId('now-row')
    expect(within(nowRow).getByText('Marcus T. +1')).toBeInTheDocument()
    expect(within(nowRow).getByText('til 6:30')).toBeInTheDocument()
    const openCells = within(nowRow).getAllByText('Open')
    expect(openCells.length).toBe(3)
    expect(within(nowRow).getByText('til 6:00')).toBeInTheDocument() // Bay 2, Ellie at 6
  })

  it('opens the booking modal for a tapped open slot', () => {
    const { onSlotClick } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Book Bay 3 at 6:30 PM' }))
    expect(onSlotClick).toHaveBeenCalledWith({ bayId: 'bay-3', bayName: 'Bay 3', startTime: at(18, 30) })
  })

  it('opens booking details when the member taps their own booking', () => {
    const { onBookingClick } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Your booking, Bay 1/ }))
    expect(onBookingClick).toHaveBeenCalledWith(mine, 'Bay 1')
  })

  it('does not make other members’ bookings tappable', () => {
    setup()
    const ellieBlock = screen.getByText('Ellie W.')
    expect(ellieBlock.closest('button')).toBeNull()
  })

  it('renders no button for past or blacked-out slots and shows the blackout reason', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Book Bay 2 at 5:00 PM' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Book Bay 3 at 8:00 PM' })).not.toBeInTheDocument()
    expect(screen.getByText('League night')).toBeInTheDocument()
  })

  it('folds earlier hours and reveals them when tapped', () => {
    setup()
    const toggle = screen.getByRole('button', { name: /Earlier today/ })
    expect(toggle).toHaveTextContent('8 am – 5 pm, 2 bookings')
    expect(screen.queryByText('Dan P.')).not.toBeInTheDocument()
    fireEvent.click(toggle)
    expect(screen.getByText('Dan P.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hide earlier/ })).toBeInTheDocument()
  })

  it('shows the whole day without now row or fold on a future date', () => {
    setup({ date: new Date(2026, 5, 19), bookings: [] })
    expect(screen.queryByTestId('now-row')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Earlier today/ })).not.toBeInTheDocument()
    expect(screen.getAllByTestId('hour-label')[0]).toHaveTextContent('8 am')
  })

  it('says the bays are closed after closing time', () => {
    vi.setSystemTime(at(22, 15))
    setup()
    expect(screen.getByText(/Bays are closed for today/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Book / })).not.toBeInTheDocument()
  })

  it('updates the now row as time passes', () => {
    setup()
    act(() => {
      vi.advanceTimersByTime(30 * 60_000)
    })
    const nowRow = screen.getByTestId('now-row')
    expect(within(nowRow).getByText('Ellie W.')).toBeInTheDocument()
  })
})
