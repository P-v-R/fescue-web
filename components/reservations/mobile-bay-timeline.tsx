'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { addMinutes, format } from 'date-fns'
import { buildBayDayModel, type BayBlock, type BayNowStatus } from '@/lib/utils/bay-day-model'
import type { BlackoutPeriod } from '@/lib/utils/blackout'
import type { Bay, BookingWithMember } from '@/lib/supabase/types'

type SelectedSlot = { bayId: string; bayName: string; startTime: Date }

type Props = {
  bays: Bay[]
  bookings: BookingWithMember[]
  date: Date
  userId: string
  blackoutPeriods: BlackoutPeriod[]
  onSlotClick: (slot: SelectedSlot) => void
  onBookingClick?: (booking: BookingWithMember, bayName: string) => void
}

const ROW_PX = 44
const GAP_PX = 1
const ROW_PITCH = ROW_PX + GAP_PX
const TIME_COL = '40px'

const clock = (d: Date) => format(d, 'h:mm')
const hourLabel = (d: Date) => format(d, 'h a').toLowerCase()

function useMinuteClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function MobileBayTimeline({
  bays,
  bookings,
  date,
  userId,
  blackoutPeriods,
  onSlotClick,
  onBookingClick,
}: Props) {
  const now = useMinuteClock()
  const dateKey = format(date, 'yyyy-MM-dd')
  // Expansion is remembered per date, so switching days folds earlier hours again
  const [expandedFor, setExpandedFor] = useState<string | null>(null)
  const showEarlier = expandedFor === dateKey
  const nowLineRef = useRef<HTMLDivElement>(null)

  const model = useMemo(
    () =>
      buildBayDayModel({
        bays,
        bookings,
        blackoutPeriods,
        date,
        userId,
        now,
        includeEarlier: showEarlier,
      }),
    [bays, bookings, blackoutPeriods, date, userId, now, showEarlier],
  )

  // Revealing earlier hours adds rows above the current time — keep "now" on screen
  useEffect(() => {
    if (showEarlier) nowLineRef.current?.scrollIntoView?.({ block: 'center' })
  }, [showEarlier])

  const columns = `${TIME_COL} repeat(${bays.length}, minmax(0, 1fr))`
  const showNowRow = model.columns.some((c) => c.now !== null)

  return (
    <section aria-label='Bay schedule' className='-mx-3'>
      {/* Bay names stay pinned while the page scrolls */}
      <div
        data-testid='bay-header'
        className='sticky top-0 z-20 grid bg-navy-dark rounded-t-sm'
        style={{ gridTemplateColumns: columns }}
      >
        <span />
        {bays.map((bay) => (
          <span
            key={bay.id}
            className='py-2.5 px-0.5 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-cream truncate'
          >
            {bay.name}
          </span>
        ))}
      </div>

      {showNowRow && (
        <div
          data-testid='now-row'
          className='grid bg-cream border-x border-b border-sand/40'
          style={{ gridTemplateColumns: columns }}
        >
          <span className='pt-2.5 text-center font-mono text-[10px] tracking-[0.08em] text-gold-dark now-label'>
            Now
          </span>
          {model.columns.map((col) => (
            <NowCell key={col.bay.id} status={col.now} />
          ))}
        </div>
      )}

      {model.earlier && (
        <button
          type='button'
          onClick={() => setExpandedFor(showEarlier ? null : dateKey)}
          aria-expanded={showEarlier}
          className='w-full h-10 flex items-center justify-between gap-3 px-3 bg-white border-x border-b border-sand/40 text-navy/65'
        >
          <span className='text-[12.5px]'>{showEarlier ? 'Hide earlier' : 'Earlier today'}</span>
          <span className='flex items-center gap-2 font-mono text-[10px]'>
            {hourLabel(model.earlier.from)} – {hourLabel(model.earlier.to)},{' '}
            {model.earlier.bookingCount} {model.earlier.bookingCount === 1 ? 'booking' : 'bookings'}
            <svg
              width='12'
              height='12'
              viewBox='0 0 12 12'
              fill='none'
              aria-hidden='true'
              className={showEarlier ? 'rotate-180' : ''}
            >
              <path d='M3 4.5l3 3 3-3' stroke='currentColor' strokeWidth='1.3' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </span>
        </button>
      )}

      {model.closed && !showEarlier && (
        <p className='px-4 py-6 bg-white border-x border-b border-sand/40 font-serif italic text-base text-navy/65 text-center'>
          Bays are closed for today. Pick another day above to book.
        </p>
      )}

      {model.rows.length > 0 && (
        <div className='relative flex'>
          {/* Time column */}
          <div className='shrink-0 flex flex-col' style={{ width: TIME_COL }}>
            {model.rows.map((row) => (
              <span
                key={row.getTime()}
                data-testid={row.getMinutes() === 0 ? 'hour-label' : undefined}
                className='pt-1 text-center font-mono text-[10px] text-navy/65'
                style={{ height: ROW_PITCH }}
              >
                {row.getMinutes() === 0 ? hourLabel(row) : ''}
              </span>
            ))}
          </div>

          {/* One grid per bay row set; bookings span rows */}
          <div
            className='flex-1 min-w-0 grid bg-navy/10 border-r border-b border-sand/40'
            style={{
              gridTemplateColumns: `repeat(${bays.length}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${model.rows.length}, ${ROW_PX}px)`,
              gap: GAP_PX,
            }}
          >
            {model.columns.map((col, colIdx) =>
              col.blocks.map((block) => (
                <Block
                  key={`${col.bay.id}-${block.rowStart}`}
                  block={block}
                  bay={col.bay}
                  column={colIdx + 1}
                  onSlotClick={onSlotClick}
                  onBookingClick={onBookingClick}
                />
              )),
            )}
          </div>

          {model.nowMinutes !== null && (
            <div
              ref={nowLineRef}
              aria-hidden='true'
              className='absolute left-0 right-0 z-10 flex items-center pointer-events-none'
              style={{ top: (model.nowMinutes / 30) * ROW_PITCH }}
            >
              <span className='shrink-0 flex justify-center' style={{ width: TIME_COL }}>
                <span className='font-mono text-[9.5px] px-1 rounded-sm bg-gold text-white'>
                  {clock(now)}
                </span>
              </span>
              <span className='flex-1 h-[1.5px] bg-gold' />
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className='flex flex-wrap gap-x-4 gap-y-1 px-1 pt-2.5'>
        <LegendItem swatch='booking-mine bg-navy' label='You' />
        <LegendItem swatch='bg-navy/[0.22]' label='Members' />
        <LegendItem swatch='bg-white border border-sand/40' label='Open' />
        <LegendItem swatch='blackout-hatch' label='Blocked' />
      </div>
    </section>
  )
}

function NowCell({ status }: { status: BayNowStatus | null }) {
  let primary = ''
  let secondary = ''
  let tone = 'text-navy'
  if (status?.kind === 'occupied') {
    primary = status.mine
      ? 'You'
      : `${status.shortName}${status.guestCount > 0 ? ` +${status.guestCount}` : ''}`
    secondary = `til ${clock(status.until)}`
  } else if (status?.kind === 'open') {
    primary = 'Open'
    secondary = status.until ? `til ${clock(status.until)}` : 'rest of day'
    tone = 'text-navy italic'
  } else if (status?.kind === 'blackout') {
    primary = status.reason ?? 'Unavailable'
    tone = 'text-gold-dark blackout-text'
  }

  return (
    <div className='min-w-0 flex flex-col items-center gap-px py-2 px-1 border-l border-sand/40'>
      <span className={`max-w-full truncate text-[12.5px] ${tone}`}>{primary}</span>
      {secondary && <span className='font-mono text-[10px] text-navy/65'>{secondary}</span>}
    </div>
  )
}

function Block({
  block,
  bay,
  column,
  onSlotClick,
  onBookingClick,
}: {
  block: BayBlock
  bay: Bay
  column: number
  onSlotClick: (slot: SelectedSlot) => void
  onBookingClick?: (booking: BookingWithMember, bayName: string) => void
}) {
  const style = { gridColumn: column, gridRow: `${block.rowStart + 1} / span ${block.span}` }

  if (block.kind === 'open') {
    return (
      <button
        type='button'
        aria-label={`Book ${bay.name} at ${format(block.slotTime, 'h:mm a')}`}
        onClick={() => onSlotClick({ bayId: bay.id, bayName: bay.name, startTime: block.slotTime })}
        className='bg-white flex items-center justify-center text-navy/20 active:bg-gold/[0.14] transition-colors'
        style={style}
      >
        <svg width='12' height='12' viewBox='0 0 12 12' fill='none' aria-hidden='true'>
          <path d='M6 2.5v7M2.5 6h7' stroke='currentColor' strokeWidth='1.2' strokeLinecap='round' />
        </svg>
      </button>
    )
  }

  if (block.kind === 'past') {
    return <div className='bg-cream-light past-slot' style={style} />
  }

  if (block.kind === 'blackout') {
    return (
      <div className='blackout-hatch px-1.5 py-1.5' style={style}>
        <span className='block font-mono text-[10px] leading-tight text-gold-dark blackout-text'>
          {block.reason ?? 'Unavailable'}
        </span>
      </div>
    )
  }

  const { booking } = block
  const start = new Date(booking.start_time)
  const end = addMinutes(start, booking.duration_minutes)
  const range = `${clock(start)}–${clock(end)}`
  const tall = block.span >= 2
  const guests = block.guestCount > 0
    ? `+${block.guestCount} ${block.guestCount === 1 ? 'guest' : 'guests'}`
    : null

  if (block.mine) {
    return (
      <button
        type='button'
        aria-label={`Your booking, ${bay.name}, ${format(start, 'h:mm a')} to ${format(end, 'h:mm a')}`}
        onClick={() => onBookingClick?.(booking, bay.name)}
        className='booking-mine bg-navy m-0.5 rounded-sm px-1.5 py-1 flex flex-col items-start gap-px text-left min-w-0 overflow-hidden'
        style={style}
      >
        <span className='font-serif text-sm leading-tight text-cream/90'>You</span>
        {tall && <span className='font-mono text-[10px] text-cream/60'>{guests ?? range}</span>}
      </button>
    )
  }

  return (
    <div
      className='bg-navy/[0.22] m-0.5 rounded-sm px-1.5 py-1 flex flex-col gap-px min-w-0 overflow-hidden'
      style={style}
    >
      <span className='text-xs leading-tight text-navy/80 truncate'>{block.shortName}</span>
      {tall && (
        <span className='font-mono text-[10px] text-navy/55 truncate'>
          {guests ?? (block.clippedStart ? `til ${clock(end)}` : range)}
        </span>
      )}
    </div>
  )
}

function LegendItem({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className='flex items-center gap-1.5 font-mono text-[10px] text-navy/65'>
      <span className={`w-2.5 h-2.5 rounded-[2px] ${swatch}`} aria-hidden='true' />
      {label}
    </span>
  )
}
