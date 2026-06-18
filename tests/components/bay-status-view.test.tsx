import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BayStatusView } from '@/app/display/bay-status-view'
import type { Bay, BookingWithMember } from '@/lib/supabase/types'

// Fixed test time: Thursday June 18 2026, 10:15 AM
// Visible window: 10:00 AM – 2:00 PM (8 slots)
const TEST_NOW = new Date(2026, 5, 18, 10, 15)

// ─── Fixtures ────────────────────────────────────────────────────────────────

const bay1: Bay = { id: 'bay-1', name: 'Bay 1', is_active: true }
const bay2: Bay = { id: 'bay-2', name: 'Bay 2', is_active: true }
const bigBay: Bay = { id: 'big-bay', name: 'Big Bay', is_active: true }
const inactiveBay: Bay = { id: 'inactive', name: 'Storage', is_active: false }

let bookingCounter = 0
function makeBooking(
  bayId: string,
  startHour: number,
  startMin: number,
  durationMins: number,
  memberName = 'George Pemberton',
): BookingWithMember {
  const start = new Date(2026, 5, 18, startHour, startMin)
  const end = new Date(start.getTime() + durationMins * 60_000)
  bookingCounter++
  return {
    id: `booking-${bookingCounter}`,
    member_id: 'member-1',
    bay_id: bayId,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    duration_minutes: durationMins,
    guests: [],
    cancelled_at: null,
    created_at: start.toISOString(),
    members: { full_name: memberName },
  }
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(TEST_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BayStatusView', () => {
  describe('header', () => {
    it('renders the club name', () => {
      render(<BayStatusView bays={[bay1]} bookings={[]} />)
      expect(screen.getByText('Fescue Golf Club')).toBeInTheDocument()
    })

    it('renders the Bay Schedule label', () => {
      render(<BayStatusView bays={[bay1]} bookings={[]} />)
      expect(screen.getByText(/Bay Schedule/i)).toBeInTheDocument()
    })

    it('renders all active bay names as column headers', () => {
      render(<BayStatusView bays={[bay1, bay2, bigBay]} bookings={[]} />)
      expect(screen.getByRole('columnheader', { name: 'Bay 1' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Bay 2' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Big Bay' })).toBeInTheDocument()
    })

    it('does not render inactive bay names', () => {
      render(<BayStatusView bays={[bay1, inactiveBay]} bookings={[]} />)
      expect(screen.queryByRole('columnheader', { name: 'Storage' })).not.toBeInTheDocument()
    })
  })

  describe('time labels', () => {
    it('renders hour marks with AM/PM', () => {
      render(<BayStatusView bays={[bay1]} bookings={[]} />)
      expect(screen.getByText('10:00 AM')).toBeInTheDocument()
      expect(screen.getByText('11:00 AM')).toBeInTheDocument()
      expect(screen.getByText('12:00 PM')).toBeInTheDocument()
    })

    it('renders half-hour marks without AM/PM', () => {
      render(<BayStatusView bays={[bay1]} bookings={[]} />)
      expect(screen.getByText('10:30')).toBeInTheDocument()
      expect(screen.getByText('11:30')).toBeInTheDocument()
    })

    it('does not show times outside the 4-hour window', () => {
      render(<BayStatusView bays={[bay1]} bookings={[]} />)
      // Window is 10 AM – 2 PM, so 9:00 AM should not appear
      expect(screen.queryByText('9:00 AM')).not.toBeInTheDocument()
      // 3:00 PM is past the window
      expect(screen.queryByText('3:00 PM')).not.toBeInTheDocument()
    })
  })

  describe('booking display', () => {
    it('shows the member first name in their booked slot', () => {
      const booking = makeBooking('bay-1', 10, 0, 60, 'George Pemberton')
      render(<BayStatusView bays={[bay1]} bookings={[booking]} />)
      expect(screen.getByText('George')).toBeInTheDocument()
    })

    it('shows only first name — not the full name', () => {
      const booking = makeBooking('bay-1', 10, 0, 60, 'George Pemberton')
      render(<BayStatusView bays={[bay1]} bookings={[booking]} />)
      expect(screen.queryByText('George Pemberton')).not.toBeInTheDocument()
      expect(screen.getByText('George')).toBeInTheDocument()
    })

    it('shows members in separate bays independently', () => {
      const b1 = makeBooking('bay-1', 10, 0, 60, 'George Pemberton')
      const b2 = makeBooking('bay-2', 10, 0, 60, 'Dorothy Winslow')
      render(<BayStatusView bays={[bay1, bay2]} bookings={[b1, b2]} />)
      expect(screen.getByText('George')).toBeInTheDocument()
      expect(screen.getByText('Dorothy')).toBeInTheDocument()
    })

    it('shows a booking that started before the visible window (clipped span)', () => {
      // 9:00 AM – 11:00 AM; window starts at 10:00 AM — still visible
      const booking = makeBooking('bay-1', 9, 0, 120, 'Perry Von Rosenvinge')
      render(<BayStatusView bays={[bay1]} bookings={[booking]} />)
      expect(screen.getByText('Perry')).toBeInTheDocument()
    })

    it('does not show a booking that ended before the window starts', () => {
      // 8:00 AM – 9:00 AM; window starts at 10:00 AM — fully past
      const booking = makeBooking('bay-1', 8, 0, 60, 'Jerry Garcia')
      render(<BayStatusView bays={[bay1]} bookings={[booking]} />)
      expect(screen.queryByText('Jerry')).not.toBeInTheDocument()
    })

    it('does not show a booking from an inactive bay', () => {
      const booking = makeBooking('inactive', 10, 0, 60, 'Hidden Member')
      render(<BayStatusView bays={[bay1, inactiveBay]} bookings={[booking]} />)
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
    })

    it('shows a single-slot (30-min) booking', () => {
      const booking = makeBooking('bay-1', 10, 30, 30, 'Alice Cooper')
      render(<BayStatusView bays={[bay1]} bookings={[booking]} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('shows a multi-slot booking only once (rowSpan, not repeated)', () => {
      const booking = makeBooking('bay-1', 10, 0, 120, 'Jerry Garcia') // 4 slots
      render(<BayStatusView bays={[bay1]} bookings={[booking]} />)
      const cells = screen.getAllByText('Jerry')
      expect(cells).toHaveLength(1)
    })
  })

  describe('edge cases', () => {
    it('renders without crashing with an empty bookings list', () => {
      expect(() =>
        render(<BayStatusView bays={[bay1, bay2]} bookings={[]} />),
      ).not.toThrow()
    })

    it('renders without crashing with an empty bays list', () => {
      expect(() =>
        render(<BayStatusView bays={[]} bookings={[]} />),
      ).not.toThrow()
    })

    it('renders without crashing when all bays are inactive', () => {
      expect(() =>
        render(<BayStatusView bays={[inactiveBay]} bookings={[]} />),
      ).not.toThrow()
    })

    it('handles a member with only a single name token gracefully', () => {
      const booking = makeBooking('bay-1', 10, 0, 60, 'Cher')
      render(<BayStatusView bays={[bay1]} bookings={[booking]} />)
      expect(screen.getByText('Cher')).toBeInTheDocument()
    })

    it('handles a booking with null members field', () => {
      const booking = makeBooking('bay-1', 10, 0, 60)
      booking.members = null
      render(<BayStatusView bays={[bay1]} bookings={[booking]} />)
      expect(screen.getByText('Member')).toBeInTheDocument()
    })
  })
})
