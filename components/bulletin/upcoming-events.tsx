import Link from 'next/link'
import { format } from 'date-fns'
import type { Event } from '@/lib/supabase/types'

export function UpcomingEvents({ events }: { events: Event[] }) {
  return (
    <aside>
      <div className='flex items-center justify-between mb-5'>
        <p className='font-mono text-label uppercase tracking-[0.28em] text-sage'>
          Upcoming Events
        </p>
        <Link
          href='/calendar'
          className='font-mono text-label uppercase tracking-[0.18em] text-gold/70 hover:text-gold transition-colors'
        >
          View all →
        </Link>
      </div>

      {events.length === 0 ? (
        <p className='font-serif italic text-base text-sand'>
          No upcoming events.
        </p>
      ) : (
        <div className='flex flex-col'>
          {events.map((event, idx) => (
            <div key={event.id}>
              <EventRow event={event} />
              {idx < events.length - 1 && (
                <div className='flex items-center gap-2 my-3'>
                  <div className='flex-1 h-px bg-gradient-to-r from-cream-mid to-transparent' />
                  <div className='w-1 h-1 bg-sand/40 rotate-45 shrink-0' />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

function EventRow({ event }: { event: Event }) {
  const date = new Date(event.starts_at)
  return (
    <div className='flex gap-4'>
      {/* Date block */}
      <div className='shrink-0 w-11 text-center'>
        <p className='font-mono text-label uppercase tracking-[0.2em] text-gold'>
          {format(date, 'MMM')}
        </p>
        <p className='font-serif text-heading font-light text-navy leading-none'>
          {format(date, 'd')}
        </p>
      </div>

      {/* Details */}
      <div className='min-w-0'>
        <p className='font-serif text-base font-light text-navy leading-snug truncate'>
          {event.title}
        </p>
        <div className='mt-0.5 min-w-0'>
          <p className='font-mono text-label tracking-[0.1em] text-navy/45'>
            {format(date, 'h:mm a')}
          </p>
          {event.location && (
            <p className='font-mono text-label tracking-[0.1em] text-navy/45 truncate'>
              {event.location}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
