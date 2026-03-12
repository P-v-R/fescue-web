'use client'

import { format } from 'date-fns'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { AdminBooking } from '@/lib/supabase/queries/bookings'
import type { Bay } from '@/lib/supabase/types'

const SLOT_START_HOUR = 8
const SLOT_COUNT = 28

function getSlots() {
  return Array.from({ length: SLOT_COUNT }, (_, i) => {
    const totalMinutes = SLOT_START_HOUR * 60 + i * 30
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return { label: m === 0 ? `${h % 12 || 12}${h < 12 ? 'a' : 'p'}` : '', h, m }
  })
}

function isBookingInSlot(booking: AdminBooking, slotH: number, slotM: number): boolean {
  const slotStart = new Date(booking.start_time)
  slotStart.setHours(slotH, slotM, 0, 0)
  const slotEnd = new Date(slotStart.getTime() + 30 * 60000)
  const bookingStart = new Date(booking.start_time)
  const bookingEnd = new Date(bookingStart.getTime() + booking.duration_minutes * 60000)
  return bookingStart < slotEnd && bookingEnd > slotStart
}

type Props = {
  bays: Bay[]
  todaysBookings: AdminBooking[]
  nowSlotIndex: number
}

export function BayTimeline({ bays, todaysBookings, nowSlotIndex }: Props) {
  const slots = getSlots()

  return (
    <Tooltip.Provider delayDuration={100}>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="grid mb-1" style={{ gridTemplateColumns: `80px repeat(${SLOT_COUNT}, 1fr)` }}>
            <div />
            {slots.map((slot, i) => (
              <div key={i} className="font-mono text-[9px] text-navy/30 text-center">
                {slot.label}
              </div>
            ))}
          </div>

          {/* Bay rows */}
          {bays.map((bay) => {
            const bayBookings = todaysBookings.filter((b) => b.bay_id === bay.id)
            const seenBookings = new Set<string>()

            return (
              <div key={bay.id} className="grid items-center mb-1" style={{ gridTemplateColumns: `80px repeat(${SLOT_COUNT}, 1fr)` }}>
                <p className="font-mono text-label text-navy/60 pr-2 truncate">{bay.name}</p>
                {slots.map((slot, i) => {
                  const booking = bayBookings.find((b) => isBookingInSlot(b, slot.h, slot.m))
                  const isNow = i === nowSlotIndex

                  if (!booking) {
                    return (
                      <div
                        key={i}
                        className={[
                          'h-6 border-r border-cream-mid/50 bg-cream-mid/30',
                          isNow ? 'ring-1 ring-inset ring-gold/60' : '',
                        ].join(' ')}
                      />
                    )
                  }

                  const isFirstSlot = !seenBookings.has(booking.id)
                  seenBookings.add(booking.id)
                  const start = new Date(booking.start_time)
                  const end = new Date(start.getTime() + booking.duration_minutes * 60000)
                  const guestCount = booking.guests?.length ?? 0

                  const cell = (
                    <div
                      className={[
                        'h-6 border-r border-navy/20 bg-navy/80 cursor-default',
                        isNow ? 'ring-1 ring-inset ring-gold/60' : '',
                      ].join(' ')}
                    />
                  )

                  if (!isFirstSlot) {
                    return <div key={i}>{cell}</div>
                  }

                  return (
                    <Tooltip.Root key={i}>
                      <Tooltip.Trigger asChild>
                        <div>{cell}</div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          side="top"
                          align="start"
                          sideOffset={6}
                          className="z-50 bg-navy text-cream px-3 py-2 shadow-lg animate-in fade-in-0 zoom-in-95"
                        >
                          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-gold mb-0.5">{bay.name}</p>
                          <p className="font-serif text-sm font-light">{booking.members?.full_name ?? 'Unknown'}</p>
                          <p className="font-mono text-[10px] text-cream/60">
                            {format(start, 'h:mm')}–{format(end, 'h:mm a')}
                            {guestCount > 0 && ` · ${guestCount} guest${guestCount > 1 ? 's' : ''}`}
                          </p>
                          <Tooltip.Arrow className="fill-navy" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </Tooltip.Provider>
  )
}
