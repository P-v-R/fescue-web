'use client'

import { useEffect, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { setRsvpAction, getEventAttendeesAction } from '@/app/(member)/calendar/actions'
import type { Event, EventRsvpWithMember } from '@/lib/supabase/types'

type Props = {
  event: Event
  onClose: () => void
  userRsvpStatus: 'going' | 'not_going' | null
  onRsvpChange: (eventId: string, status: 'going' | 'not_going' | null) => void
}

export function EventModal({ event, onClose, userRsvpStatus, onRsvpChange }: Props) {
  const [attendees, setAttendees] = useState<EventRsvpWithMember[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Load attendees when modal opens
  useEffect(() => {
    if (!event.rsvp_enabled) return
    getEventAttendeesAction(event.id).then((result) => {
      if (result.data) setAttendees(result.data)
    })
  }, [event.id, event.rsvp_enabled])

  function handleRsvp(newStatus: 'going' | 'not_going') {
    // Toggle off if clicking the same status
    const next = userRsvpStatus === newStatus ? null : newStatus
    startTransition(async () => {
      onRsvpChange(event.id, next)
      await setRsvpAction(event.id, next)
      // Refresh attendees after change
      const result = await getEventAttendeesAction(event.id)
      if (result.data) setAttendees(result.data)
    })
  }

  const date = new Date(event.starts_at)
  const goingAttendees = attendees.filter((a) => a.status === 'going')
  const goingCount = goingAttendees.length

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-dark/70 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centred on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      >
        <div
          className="relative bg-cream w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl rounded-t-2xl sm:rounded-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Corner ticks */}
          <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/40 z-10" />
          <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/40 z-10" />
          <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/40 z-10" />
          <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/40 z-10" />

          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-navy/20" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-cream/90 shadow-sm hover:bg-cream transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="#1a3020" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Event image */}
          {event.image_url && (
            <div className="relative w-full h-44 sm:h-56 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/40 to-transparent" />
            </div>
          )}

          <div className="px-5 sm:px-8 py-5 sm:py-6">
            {/* Date eyebrow */}
            <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-2">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </p>

            {/* Title */}
            <h2 className="font-serif text-heading font-light text-navy leading-snug mb-4">
              {event.title}
            </h2>

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 mb-5 pb-5 border-b border-cream-mid">
              <MetaItem label="Time" value={format(date, 'h:mm a')} />
              {event.ends_at && (
                <MetaItem label="Until" value={format(new Date(event.ends_at), 'h:mm a')} />
              )}
              {event.location && (
                <MetaItem label="Location" value={event.location} />
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-5">
                <p className="font-sans text-sm font-light text-navy-dark leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            {/* RSVP section */}
            {event.rsvp_enabled && (
              <div className="pt-1">
                {/* RSVP buttons */}
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => handleRsvp('going')}
                    disabled={isPending}
                    className={[
                      'font-mono text-label uppercase tracking-[0.22em] px-5 py-2.5 transition-all duration-200 disabled:opacity-50',
                      userRsvpStatus === 'going'
                        ? 'bg-navy text-cream shadow-[inset_0_0_0_1px_rgba(184,150,60,0.4)]'
                        : 'border border-navy/30 text-navy hover:border-navy hover:bg-navy/5',
                    ].join(' ')}
                  >
                    {goingCount > 0 ? `Going (${goingCount})` : 'Going'}
                  </button>
                  <button
                    onClick={() => handleRsvp('not_going')}
                    disabled={isPending}
                    className={[
                      'font-mono text-label uppercase tracking-[0.22em] px-5 py-2.5 transition-all duration-200 disabled:opacity-50',
                      userRsvpStatus === 'not_going'
                        ? 'bg-navy/10 text-navy border border-navy/20'
                        : 'border border-cream-mid text-navy/50 hover:border-navy/30 hover:text-navy/70',
                    ].join(' ')}
                  >
                    Can&apos;t make it
                  </button>
                </div>

                {/* Attendee list */}
                {goingCount > 0 && (
                  <p className="font-mono text-label text-navy/50 tracking-[0.08em]">
                    <span className="text-sage uppercase tracking-[0.18em] mr-2">Going:</span>
                    {goingAttendees
                      .slice(0, 5)
                      .map((a) => a.members?.full_name?.split(' ')[0] ?? 'Member')
                      .join(', ')}
                    {goingCount > 5 && (
                      <span className="text-navy/35"> +{goingCount - 5} more</span>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-label uppercase tracking-[0.22em] text-sage mb-0.5">{label}</p>
      <p className="font-sans text-sm font-light text-navy-dark">{value}</p>
    </div>
  )
}
