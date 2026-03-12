import Link from 'next/link';
import {
  format,
  isToday,
  isTomorrow,
  differenceInCalendarDays,
} from 'date-fns';
import type { BookingWithBay } from '@/lib/supabase/types';

function dayLabel(date: Date) {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
}

export function UpcomingReservations({
  bookings,
}: {
  bookings: BookingWithBay[];
}) {
  return (
    <div>
      <p className='font-mono text-label uppercase tracking-[0.28em] text-sage mb-4'>
        Your Reservations
      </p>

      {bookings.length === 0 ? (
        <div className='relative bg-cream border border-cream-mid overflow-hidden'>
          {/* Corner ticks */}
          <span className='absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/30 pointer-events-none' />
          <span className='absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/30 pointer-events-none' />
          <span className='absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/30 pointer-events-none' />
          <span className='absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/30 pointer-events-none' />
          {/* Inset frame */}
          <div className='frame-scalloped absolute inset-2 pointer-events-none' />
          <div className='frame-scalloped absolute inset-[10px] pointer-events-none' />
          <div className='relative z-10 px-5 pt-5 pb-6'>
            <p className='font-serif italic text-base text-navy/40 leading-snug mb-4 mt-2'>
              No tee times
              <br />
              on the books.
            </p>
            <p className='font-mono text-label text-navy/35 mb-5'>
              The bays await.
            </p>
            <Link
              href='/reservations'
              className='inline-flex items-center gap-2 font-mono text-label uppercase tracking-[0.22em] text-gold hover:text-navy transition-colors duration-200'
            >
              Reserve a Bay →
            </Link>
          </div>
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          {bookings.map((booking) => {
            const start = new Date(booking.start_time);
            const today = isToday(start);
            const tomorrow = isTomorrow(start);
            const daysAway = differenceInCalendarDays(start, new Date());
            const urgent = today || tomorrow;
            const nearTerm = daysAway > 1 && daysAway <= 6;

            return (
              <div
                key={booking.id}
                className={[
                  'relative bg-white border flex overflow-hidden',
                  today ? 'border-gold/40' : 'border-cream-mid',
                ].join(' ')}
              >
                {/* Urgency strip */}
                <div
                  className={[
                    'w-[3px] flex-shrink-0',
                    today
                      ? 'bg-gold'
                      : tomorrow
                        ? 'bg-sage/70'
                        : 'bg-cream-mid',
                  ].join(' ')}
                />

                {/* Date column */}
                <div
                  className={[
                    'flex-shrink-0 w-11 flex flex-col items-center justify-center py-3 border-r',
                    today
                      ? 'border-gold/20 bg-gold/[0.04]'
                      : 'border-cream-mid',
                  ].join(' ')}
                >
                  <p className='font-mono text-label text-gold uppercase leading-none mb-0.5'>
                    {format(start, 'MMM')}
                  </p>
                  <p className='font-serif text-heading font-light text-navy leading-none'>
                    {format(start, 'd')}
                  </p>
                </div>

                {/* Details */}
                <div className='flex-1 min-w-0 px-3 py-2.5'>
                  <div className='flex items-baseline gap-1.5'>
                    {(urgent || nearTerm) && (
                      <span
                        className={[
                          'font-mono text-label uppercase tracking-[0.15em] shrink-0',
                          today ? 'text-gold' : 'text-sage',
                        ].join(' ')}
                      >
                        {today
                          ? 'Today'
                          : tomorrow
                            ? 'Tomorrow'
                            : format(start, 'EEEE')}
                      </span>
                    )}
                    {(urgent || nearTerm) && (
                      <span className='text-navy/25 font-mono text-label shrink-0'>
                        ·
                      </span>
                    )}
                    <p className='font-mono text-label uppercase tracking-[0.15em] text-navy truncate'>
                      {booking.bays?.name ?? 'Bay'}
                    </p>
                  </div>
                  <p className='font-mono text-label text-navy/45 mt-0.5'>
                    {format(start, 'h:mm a')} · {booking.duration_minutes}m
                  </p>
                  {booking.guests?.length > 0 && (
                    <p className='font-mono text-label text-sand/60 mt-0.5 truncate'>
                      + {booking.guests.map((g) => g.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
