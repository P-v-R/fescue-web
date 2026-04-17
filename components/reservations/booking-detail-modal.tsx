'use client'

import { useState, useTransition } from 'react'
import { format, isBefore } from 'date-fns'
import { cancelBookingAction } from '@/app/(member)/reservations/actions'
import type { BookingWithMember } from '@/lib/supabase/types'

type Props = {
  booking: BookingWithMember
  bayName: string
  onClose: () => void
  onCancelled: (bookingId: string) => void
}

export function BookingDetailModal({ booking, bayName, onClose, onCancelled }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const startTime = new Date(booking.start_time)
  const endTime = new Date(booking.end_time)
  const isPast = isBefore(startTime, new Date())
  const guests = booking.guests ?? []

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const result = await cancelBookingAction(booking.id)
      if (result.error) {
        setError(result.error)
      } else {
        onCancelled(booking.id)
        onClose()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy-dark/60 backdrop-blur-[2px]" />

      {/* Card */}
      <div
        className="relative w-full max-w-sm bg-cream border border-cream-mid shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner ticks */}
        <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/40" />
        <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/40" />
        <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/40" />
        <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/40" />

        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5">
          <div>
            <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-1">
              {bayName}
            </p>
            <h2 className="font-serif text-2xl font-light text-navy leading-snug">
              {format(startTime, 'EEEE, MMM d')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center text-navy/30 hover:text-navy transition-colors -mt-1 -mr-1"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="w-8 h-px bg-gold mx-7 mb-5" />

        {/* Details */}
        <div className="px-7 pb-2 space-y-4">
          {/* Time */}
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-label uppercase tracking-[0.2em] text-navy/50">Time</span>
            <span className="font-serif text-base font-light text-navy">
              {format(startTime, 'h:mm a')} – {format(endTime, 'h:mm a')}
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-label uppercase tracking-[0.2em] text-navy/50">Duration</span>
            <span className="font-serif text-base font-light text-navy">
              {booking.duration_minutes} min
            </span>
          </div>

          {/* Guests */}
          {guests.length > 0 && (
            <div>
              <span className="font-mono text-label uppercase tracking-[0.2em] text-navy/50 block mb-2">
                Guests
              </span>
              <div className="space-y-1">
                {guests.map((g, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-sans text-sm font-light text-navy">{g.name}</span>
                    {g.email && <span className="font-mono text-label text-navy/40">{g.email}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {guests.length === 0 && (
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-label uppercase tracking-[0.2em] text-navy/50">Guests</span>
              <span className="font-serif italic text-sm text-navy/30">None</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-7 pt-5 pb-7">
          {error && (
            <p className="font-mono text-label text-red-500 mb-3">{error}</p>
          )}
          {!isPast && (
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="w-full border border-navy/20 text-navy font-mono text-label uppercase tracking-[0.22em] py-3 hover:bg-navy hover:text-cream hover:border-navy transition-colors disabled:opacity-40"
            >
              {isPending ? 'Cancelling…' : 'Cancel Booking'}
            </button>
          )}
          {isPast && (
            <p className="font-mono text-label uppercase tracking-[0.18em] text-navy/30 text-center">
              This booking has passed
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
