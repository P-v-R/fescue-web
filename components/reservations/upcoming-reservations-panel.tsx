'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { cancelBookingAction } from '@/app/(member)/reservations/actions'
import type { BookingWithBay } from '@/lib/supabase/types'

type Props = {
  bookings: BookingWithBay[]
  onCancelled: (bookingId: string) => void
}

// ── Shared booking list ───────────────────────────────────────────────────────

function BookingList({ bookings, onCancelled }: Props) {
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function handleCancel(id: string) {
    setCancelling(id)
    setErrors((prev) => { const next = { ...prev }; delete next[id]; return next })
    startTransition(async () => {
      const result = await cancelBookingAction(id)
      setCancelling(null)
      if (result.error) {
        setErrors((prev) => ({ ...prev, [id]: result.error! }))
      } else {
        onCancelled(id)
      }
    })
  }

  if (bookings.length === 0) {
    return (
      <p className="font-serif italic text-label text-sand">No upcoming reservations.</p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {bookings.map((booking) => {
        const start = new Date(booking.start_time)
        const end = new Date(start.getTime() + booking.duration_minutes * 60000)
        const isCancelling = isPending && cancelling === booking.id

        return (
          <div key={booking.id} className="bg-white border border-cream-mid px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-serif text-xl font-light text-navy">
                    {booking.bays?.name ?? 'Bay'}
                  </span>
                  <span className="font-mono text-label uppercase tracking-[0.15em] text-navy/40">
                    {booking.duration_minutes}min
                  </span>
                </div>
                <p className="font-mono text-label tracking-[0.1em] text-navy/55">
                  {format(start, 'EEEE, MMMM d')} · {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
                </p>
                {booking.guests?.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {booking.guests.map((g, i) => (
                      <p key={i} className="font-sans text-label font-light text-navy/45">
                        Guest{booking.guests.length > 1 ? ` ${i + 1}` : ''}: {g.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleCancel(booking.id)}
                disabled={isCancelling}
                className="shrink-0 font-mono text-label uppercase tracking-[0.18em] text-navy/35 hover:text-red-500 transition-colors disabled:opacity-40 pt-1"
              >
                {isCancelling ? 'Cancelling…' : 'Cancel'}
              </button>
            </div>
            {errors[booking.id] && (
              <p className="font-mono text-label text-red-500 mt-2">{errors[booking.id]}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Desktop: inline section below the bay grid ────────────────────────────────

export function UpcomingReservationsDesktop({ bookings, onCancelled }: Props) {
  return (
    <section className="mt-10 pt-8 border-t border-cream-mid">
      <div className="flex items-baseline gap-3 mb-5">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-sage">
          Your Upcoming Reservations
        </p>
        {bookings.length > 0 && (
          <span className="font-mono text-label text-navy/30">{bookings.length}</span>
        )}
      </div>
      <BookingList bookings={bookings} onCancelled={onCancelled} />
    </section>
  )
}

// ── Mobile: FAB + bottom-sheet modal ─────────────────────────────────────────

export function UpcomingReservationsMobile({ bookings, onCancelled }: Props) {
  const [open, setOpen] = useState(false)

  function handleCancelled(id: string) {
    onCancelled(id)
    if (bookings.length <= 1) setOpen(false)
  }

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-navy text-cream px-4 py-3 shadow-xl font-mono text-label uppercase tracking-[0.18em]"
      >
        My Bookings
        {bookings.length > 0 && (
          <span
            className="flex items-center justify-center w-5 h-5 rounded-full bg-gold text-navy font-mono font-bold leading-none"
            style={{ fontSize: 10 }}
          >
            {bookings.length}
          </span>
        )}
      </button>

      {/* Bottom-sheet modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-navy-dark/60 backdrop-blur-[2px]" />
          <div
            className="relative w-full bg-cream border-t border-cream-mid shadow-2xl flex flex-col"
            style={{ maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-sand-light" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-6 pt-3 pb-3 shrink-0">
              <div className="flex items-baseline gap-3">
                <p className="font-mono text-label uppercase tracking-[0.28em] text-sage">
                  Your Upcoming Reservations
                </p>
                {bookings.length > 0 && (
                  <span className="font-mono text-label text-navy/30">{bookings.length}</span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center text-navy/30 hover:text-navy transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="w-8 h-px bg-gold mx-6 mb-5 shrink-0" />

            {/* Scrollable booking list */}
            <div className="overflow-y-auto px-6 pb-10">
              <BookingList bookings={bookings} onCancelled={handleCancelled} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
