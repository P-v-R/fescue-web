import Link from 'next/link'
import { format, isWithinInterval } from 'date-fns'
import type { AdminBooking } from '@/lib/supabase/queries/bookings'
import type { Bay } from '@/lib/supabase/types'

type Props = {
  activeMembers: number
  bookingsThisWeek: number
  todaysBookings: AdminBooking[]
  bays: Bay[]
  pendingRequests: number
}

// 30-minute slots from 8:00am to 10:00pm = 28 slots
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

export function DashboardStats({ activeMembers, bookingsThisWeek, todaysBookings, bays, pendingRequests }: Props) {
  const slots = getSlots()
  const now = new Date()

  // Current slot index for "now" line
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = SLOT_START_HOUR * 60
  const nowSlotIndex = Math.floor((nowMinutes - startMinutes) / 30)

  return (
    <div className="mb-10 flex flex-col gap-6">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Active Members" value={activeMembers}>
          <Link href="/admin/members" className="font-mono text-label text-gold/70 hover:text-gold transition-colors uppercase tracking-[0.15em]">
            View all →
          </Link>
        </StatCard>
        <StatCard label="Bookings This Week" value={bookingsThisWeek} />
        <StatCard label="Pending Requests" value={pendingRequests}>
          {pendingRequests > 0 && (
            <span className="font-mono text-label text-sand/70 uppercase tracking-[0.15em]">needs review</span>
          )}
        </StatCard>
      </div>

      {/* Today's bay timeline */}
      <div className="bg-white border border-cream-mid p-5">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-4">
          Today — {format(now, 'EEEE, MMMM d')}
        </p>

        {todaysBookings.length === 0 ? (
          <p className="font-serif italic text-label text-sand">No bookings today.</p>
        ) : (
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
                return (
                  <div key={bay.id} className="grid items-center mb-1" style={{ gridTemplateColumns: `80px repeat(${SLOT_COUNT}, 1fr)` }}>
                    <p className="font-mono text-label text-navy/60 pr-2 truncate">{bay.name}</p>
                    {slots.map((slot, i) => {
                      const booking = bayBookings.find((b) => isBookingInSlot(b, slot.h, slot.m))
                      const isNow = i === nowSlotIndex
                      return (
                        <div
                          key={i}
                          title={booking ? `${booking.members?.full_name} · ${format(new Date(booking.start_time), 'h:mm a')}` : undefined}
                          className={[
                            'h-6 border-r border-cream-mid/50',
                            booking ? 'bg-navy/80' : 'bg-cream-mid/30',
                            isNow ? 'ring-1 ring-inset ring-gold/60' : '',
                          ].join(' ')}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, children }: { label: string; value: number; children?: React.ReactNode }) {
  return (
    <div className="bg-white border border-cream-mid px-5 py-4 flex flex-col gap-1">
      <p className="font-mono text-label uppercase tracking-[0.18em] text-sand">{label}</p>
      <p className="font-serif text-3xl font-light text-navy">{value}</p>
      {children}
    </div>
  )
}
