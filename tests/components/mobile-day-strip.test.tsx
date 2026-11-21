import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileDayStrip } from '@/components/reservations/mobile-day-strip'

// Thursday June 18 2026, 10:15 AM
const NOW = new Date(2026, 5, 18, 10, 15)
const TODAY = new Date(2026, 5, 18)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

function setup(date = TODAY, bookedDates: string[] = []) {
  const setDate = vi.fn()
  render(<MobileDayStrip date={date} setDate={setDate} bookedDates={new Set(bookedDates)} />)
  return { setDate }
}

describe('MobileDayStrip', () => {
  it('renders seven days starting today with today selected', () => {
    setup()
    const days = screen.getAllByRole('button', { name: /June \d+/ })
    expect(days).toHaveLength(7)
    expect(days[0]).toHaveAccessibleName(/Thursday, June 18/)
    expect(days[6]).toHaveAccessibleName(/Wednesday, June 24/)
    expect(days[0]).toHaveAttribute('aria-pressed', 'true')
    expect(days[1]).toHaveAttribute('aria-pressed', 'false')
  })

  it('selects a day at start of day when tapped', () => {
    const { setDate } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Sunday, June 21/ }))
    expect(setDate).toHaveBeenCalledWith(new Date(2026, 5, 21))
  })

  it('marks days with an upcoming booking', () => {
    setup(TODAY, ['2026-06-20'])
    expect(screen.getByRole('button', { name: /Saturday, June 20, you have a booking/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Friday, June 19$/ })).toBeInTheDocument()
  })

  it('picks a later date through the date input, limited to 90 days out', () => {
    const { setDate } = setup()
    const input = screen.getByLabelText('Pick another date') as HTMLInputElement
    expect(input.min).toBe('2026-06-18')
    expect(input.max).toBe('2026-09-16')
    fireEvent.change(input, { target: { value: '2026-07-28' } })
    expect(setDate).toHaveBeenCalledWith(new Date(2026, 6, 28))
  })

  it('labels a picked date that is past the strip', () => {
    setup(new Date(2026, 6, 28))
    expect(screen.getByText('Tuesday, July 28')).toBeInTheDocument()
    const days = screen.getAllByRole('button', { name: /June \d+/ })
    expect(days.every((d) => d.getAttribute('aria-pressed') === 'false')).toBe(true)
  })
})
