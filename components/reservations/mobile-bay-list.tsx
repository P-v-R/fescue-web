'use client'

import { useState, useMemo } from 'react'
import { format, isBefore, isToday, addDays, startOfDay } from 'date-fns'
import {
  generateTimeSlots,
  durationToSpan,
  timeToSlotIndex,
  formatSlotShort,
} from '@/lib/utils/time-slots'
import { findBlackout, type BlackoutPeriod } from '@/lib/utils/blackout'
import type { Bay, BookingWithMember } from '@/lib/supabase/types'
import { BayGrid } from '@/components/reservations/bay-grid'

type SelectedSlot = { bayId: string; bayName: string; startTime: Date }
type ViewMode = 'bay' | 'all'

type Props = {
  bays: Bay[]
  bookings: BookingWithMember[]
  date: Date
  setDate: (d: Date) => void
  userId: string
  onSlotClick: (slot: SelectedSlot) => void
  blackoutPeriods: BlackoutPeriod[]
}

function formatMemberName(fullName: string | null | undefined): string {
  if (!fullName) return 'Member'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

// ─── Next Available ────────────────────────────────────────────────────────────

function useNextAvailable(
  bays: Bay[],
  bookings: BookingWithMember[],
  date: Date,
  blackoutPeriods: BlackoutPeriod[],
) {
  return useMemo(() => {
    const now = new Date()
    const slots = generateTimeSlots(date)
    const bookedKeys = new Set(
      bookings.map((b) => `${b.bay_id}-${new Date(b.start_time).getTime()}`),
    )

    const available: SelectedSlot[] = []

    for (const slotTime of slots) {
      if (isBefore(slotTime, now)) continue
      for (const bay of bays) {
        if (available.length >= 5) break
        const key = `${bay.id}-${slotTime.getTime()}`
        if (bookedKeys.has(key)) continue
        if (findBlackout(slotTime, bay.id, blackoutPeriods)) continue
        available.push({ bayId: bay.id, bayName: bay.name, startTime: slotTime })
      }
      if (available.length >= 5) break
    }

    return available
  }, [bays, bookings, date, blackoutPeriods])
}

// ─── Slot list for one bay ─────────────────────────────────────────────────────

type CellType =
  | { kind: 'available'; slotTime: Date }
  | { kind: 'past'; slotTime: Date }
  | { kind: 'mine'; slotTime: Date; booking: BookingWithMember }
  | { kind: 'other'; slotTime: Date; booking: BookingWithMember }
  | { kind: 'blackout'; slotTime: Date; reason: string | null }

function useBayCells(
  bayId: string,
  bookings: BookingWithMember[],
  date: Date,
  userId: string,
  blackoutPeriods: BlackoutPeriod[],
): CellType[] {
  return useMemo(() => {
    const now = new Date()
    const slots = generateTimeSlots(date)

    const bookingStarts = new Map<number, { booking: BookingWithMember; span: number }>()
    const continuations = new Set<number>()

    for (const booking of bookings) {
      if (booking.bay_id !== bayId) continue
      const slotIdx = timeToSlotIndex(new Date(booking.start_time))
      const span = durationToSpan(booking.duration_minutes)
      if (slotIdx < 0 || slotIdx >= slots.length) continue
      bookingStarts.set(slotIdx, { booking, span })
      for (let i = 1; i < span; i++) continuations.add(slotIdx + i)
    }

    const cells: CellType[] = []

    for (let i = 0; i < slots.length; i++) {
      if (continuations.has(i)) continue
      const slotTime = slots[i]
      const bookingData = bookingStarts.get(i)

      if (bookingData) {
        const kind = bookingData.booking.member_id === userId ? 'mine' : 'other'
        cells.push({ kind, slotTime, booking: bookingData.booking })
        continue
      }

      if (isBefore(slotTime, now)) {
        cells.push({ kind: 'past', slotTime })
        continue
      }

      const blackout = findBlackout(slotTime, bayId, blackoutPeriods)
      if (blackout) {
        cells.push({ kind: 'blackout', slotTime, reason: blackout.reason })
        continue
      }

      cells.push({ kind: 'available', slotTime })
    }

    return cells
  }, [bayId, bookings, date, userId, blackoutPeriods])
}

// ─── Single bay slot list ──────────────────────────────────────────────────────

function BaySlotList({
  bay,
  bookings,
  date,
  userId,
  blackoutPeriods,
  onSlotClick,
}: {
  bay: Bay
  bookings: BookingWithMember[]
  date: Date
  userId: string
  blackoutPeriods: BlackoutPeriod[]
  onSlotClick: (slot: SelectedSlot) => void
}) {
  const cells = useBayCells(bay.id, bookings, date, userId, blackoutPeriods)

  return (
    <div className='divide-y divide-sand/25 border border-sand/40 bg-white'>
      {cells.map((cell, i) => {
        if (cell.kind === 'past') {
          return (
            <div key={i} className='flex items-center gap-4 px-4 h-11 opacity-35'>
              <span className='font-mono text-label tracking-[0.1em] text-navy w-16'>
                {formatSlotShort(cell.slotTime)}
              </span>
              <span className='h-px flex-1 bg-sand/50' />
            </div>
          )
        }

        if (cell.kind === 'available') {
          return (
            <button
              key={i}
              onClick={() => onSlotClick({ bayId: bay.id, bayName: bay.name, startTime: cell.slotTime })}
              className='w-full flex items-center gap-4 px-4 h-14 hover:bg-gold/[0.07] active:bg-gold/[0.14] transition-colors group'
            >
              <span className='font-mono text-label tracking-[0.12em] text-navy w-16'>
                {formatSlotShort(cell.slotTime)}
              </span>
              <span className='flex-1 text-left font-mono text-label uppercase tracking-[0.18em] text-navy/30 group-hover:text-navy/50 transition-colors'>
                Available
              </span>
              <svg width='16' height='16' viewBox='0 0 16 16' fill='none' className='text-gold/60 group-hover:text-gold transition-colors'>
                <path d='M6 3l5 5-5 5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            </button>
          )
        }

        if (cell.kind === 'mine') {
          return (
            <div key={i} className='flex items-center gap-4 px-4 h-14 bg-navy'>
              <span className='font-mono text-label tracking-[0.12em] text-cream/70 w-16'>
                {formatSlotShort(cell.slotTime)}
              </span>
              <span className='flex-1 font-mono text-label uppercase tracking-[0.18em] text-cream/90'>
                Your Booking
              </span>
              <span className='font-mono text-label text-gold/70'>
                {cell.booking.duration_minutes}m
              </span>
            </div>
          )
        }

        if (cell.kind === 'other') {
          return (
            <div key={i} className='flex items-center gap-4 px-4 h-14 bg-navy/[0.07]'>
              <span className='font-mono text-label tracking-[0.12em] text-navy/50 w-16'>
                {formatSlotShort(cell.slotTime)}
              </span>
              <span className='flex-1 font-mono text-label uppercase tracking-[0.18em] text-navy/40'>
                {formatMemberName(cell.booking.members?.full_name)}
              </span>
            </div>
          )
        }

        if (cell.kind === 'blackout') {
          return (
            <div key={i} className='flex items-center gap-4 px-4 h-14 bg-gold/[0.08]'>
              <span className='font-mono text-label tracking-[0.12em] text-navy/50 w-16'>
                {formatSlotShort(cell.slotTime)}
              </span>
              <span className='font-mono text-label uppercase tracking-[0.15em] text-gold/70'>
                {cell.reason ?? 'Unavailable'}
              </span>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export function MobileBayList({
  bays,
  bookings,
  date,
  setDate,
  userId,
  onSlotClick,
  blackoutPeriods,
}: Props) {
  const [selectedBayId, setSelectedBayId] = useState(bays[0]?.id ?? '')
  const [viewMode, setViewMode] = useState<ViewMode>('bay')
  const selectedBay = bays.find((b) => b.id === selectedBayId) ?? bays[0]
  const nextAvailable = useNextAvailable(bays, bookings, date, blackoutPeriods)

  const today = startOfDay(new Date())
  const maxDate = addDays(today, 30)

  function prevDay() {
    const prev = addDays(date, -1)
    if (!isBefore(prev, today)) setDate(prev)
  }

  function nextDay() {
    const next = addDays(date, 1)
    if (!isBefore(maxDate, next)) setDate(next)
  }

  const canGoPrev = !isBefore(addDays(date, -1), today)
  const canGoNext = !isBefore(maxDate, addDays(date, 1))

  return (
    <div className='flex flex-col gap-4'>

      {/* ── Date navigation ── */}
      <div className='flex items-center justify-between gap-3 bg-white border border-sand/40 px-4 py-3'>
        <button
          onClick={prevDay}
          disabled={!canGoPrev}
          className='w-9 h-9 flex items-center justify-center text-navy/40 disabled:opacity-20 hover:text-navy transition-colors'
          aria-label='Previous day'
        >
          <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
            <path d='M10 3L5 8l5 5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </button>

        <div className='text-center'>
          <p className='font-serif text-base font-light text-navy'>
            {isToday(date) ? 'Today' : format(date, 'EEEE')}
          </p>
          <p className='font-mono text-label uppercase tracking-[0.18em] text-navy/45'>
            {format(date, 'MMM d')}
          </p>
        </div>

        <button
          onClick={nextDay}
          disabled={!canGoNext}
          className='w-9 h-9 flex items-center justify-center text-navy/40 disabled:opacity-20 hover:text-navy transition-colors'
          aria-label='Next day'
        >
          <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
            <path d='M6 3l5 5-5 5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </button>
      </div>

      {/* ── View toggle ── */}
      <div className='flex border border-sand/40 bg-white overflow-hidden'>
        <button
          onClick={() => setViewMode('bay')}
          className={[
            'flex-1 py-2 font-mono text-label uppercase tracking-[0.18em] transition-colors',
            viewMode === 'bay'
              ? 'bg-navy text-cream'
              : 'text-navy/50 hover:text-navy',
          ].join(' ')}
        >
          By Bay
        </button>
        <button
          onClick={() => setViewMode('all')}
          className={[
            'flex-1 py-2 font-mono text-label uppercase tracking-[0.18em] transition-colors border-l border-sand/40',
            viewMode === 'all'
              ? 'bg-navy text-cream'
              : 'text-navy/50 hover:text-navy',
          ].join(' ')}
        >
          All Bays
        </button>
      </div>

      {/* ── Next available ── */}
      {nextAvailable.length > 0 && (
        <div>
          <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-2 px-0.5'>
            Next Available
          </p>
          <div className='flex gap-2 overflow-x-auto pb-1'>
            {nextAvailable.map((slot, i) => (
              <button
                key={i}
                onClick={() => onSlotClick(slot)}
                className='flex-shrink-0 flex flex-col items-center gap-1 bg-white border border-sand/40 px-4 py-3 hover:border-navy/40 hover:bg-cream transition-colors active:bg-cream-mid'
              >
                <span className='font-mono text-label uppercase tracking-[0.15em] text-gold'>
                  {slot.bayName}
                </span>
                <span className='font-serif text-base font-light text-navy'>
                  {formatSlotShort(slot.startTime)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'bay' ? (
        <>
          {/* ── Bay tabs ── */}
          <div className='flex border-b border-cream-mid'>
            {bays.map((bay) => (
              <button
                key={bay.id}
                onClick={() => setSelectedBayId(bay.id)}
                className={[
                  'flex-1 py-2.5 font-mono text-label uppercase tracking-[0.2em] border-b-2 -mb-px transition-colors',
                  bay.id === selectedBayId
                    ? 'border-gold text-navy'
                    : 'border-transparent text-navy/40 hover:text-navy',
                ].join(' ')}
              >
                {bay.name}
              </button>
            ))}
          </div>

          {/* ── Slot list (single bay) ── */}
          <BaySlotList
            bay={selectedBay}
            bookings={bookings}
            date={date}
            userId={userId}
            blackoutPeriods={blackoutPeriods}
            onSlotClick={onSlotClick}
          />
        </>
      ) : (
        <BayGrid
          bays={bays}
          bookings={bookings}
          date={date}
          userId={userId}
          onSlotClick={onSlotClick}
          blackoutPeriods={blackoutPeriods}
        />
      )}
    </div>
  )
}
