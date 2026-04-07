import Link from 'next/link'
import { format } from 'date-fns'
import type { Event } from '@/lib/supabase/types'

export function UpcomingEvents({ events }: { events: Event[] }) {
  return (
    <aside className='relative bg-navy overflow-hidden'>
      {/* Corner ticks */}
      <span className='absolute top-0 left-0 w-5 h-5 border-t border-l border-gold/40' />
      <span className='absolute top-0 right-0 w-5 h-5 border-t border-r border-gold/40' />
      <span className='absolute bottom-0 left-0 w-5 h-5 border-b border-l border-gold/40' />
      <span className='absolute bottom-0 right-0 w-5 h-5 border-b border-r border-gold/40' />

      {/* Double scalloped frames */}
      <div className='frame-scalloped absolute inset-2 pointer-events-none' />
      <div className='frame-scalloped absolute inset-[10px] pointer-events-none' />

      <div className='relative px-5 py-5'>
        <div className='flex items-center justify-between mb-5'>
          <p className='font-mono text-label uppercase tracking-[0.28em] text-gold/80'>
            Upcoming Events
          </p>
          <Link
            href='/calendar'
            className='font-mono text-label uppercase tracking-[0.18em] text-cream/50 hover:text-cream transition-colors'
          >
            View all →
          </Link>
        </div>

        {events.length === 0 ? (
          <p className='font-serif italic text-base text-cream/40'>
            No upcoming events.
          </p>
        ) : (
          <div className='flex flex-col'>
            {events.map((event, idx) => (
              <div key={event.id}>
                <EventRow event={event} />
                {idx < events.length - 1 && (
                  <div className='flex items-center gap-2 my-3'>
                    <div className='flex-1 h-px bg-gradient-to-r from-gold/20 to-transparent' />
                    <div className='w-1 h-1 bg-gold/30 rotate-45 shrink-0' />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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
        <p className='font-serif text-heading font-light text-cream leading-none'>
          {format(date, 'd')}
        </p>
      </div>

      {/* Details */}
      <div className='min-w-0'>
        <p className='font-serif text-base font-light text-cream leading-snug truncate'>
          {event.title}
        </p>
        <div className='mt-0.5 min-w-0'>
          <p className='font-mono text-label tracking-[0.1em] text-cream/50'>
            {format(date, 'h:mm a')}
          </p>
          {event.location && (
            <p className='font-mono text-label tracking-[0.1em] text-cream/50 truncate'>
              {event.location}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
