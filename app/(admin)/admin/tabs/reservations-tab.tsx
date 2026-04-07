'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { format, startOfDay } from 'date-fns';
import type { AdminBooking } from '@/lib/supabase/queries/bookings';
import { useActionState } from '../hooks/use-action-state';
import { EmptyState } from '../components/empty-state';
import { cancelBookingAdminAction, getBookingsForDateAction } from '../actions';

export function ReservationsTab({
  initialBookings,
}: {
  initialBookings: AdminBooking[];
}) {
  const { message, isPending, run } = useActionState();
  const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const [dateStr, setDateStr] = useState(todayStr);
  const [bookings, setBookings] = useState<AdminBooking[]>(initialBookings);
  const [isLoading, setIsLoading] = useState(false);

  const isInitialMount = useRef(true);

  const fetchBookings = useCallback(async (d: string) => {
    setIsLoading(true);
    try {
      const result = await getBookingsForDateAction(d);
      if (result.bookings) setBookings(result.bookings);
      else if (result.error) setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchBookings(dateStr);
  }, [dateStr, fetchBookings]);

  const isToday = dateStr === todayStr;

  return (
    <div>
      <div className='flex items-end gap-6 mb-8 flex-wrap'>
        <div>
          <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-2'>
            Date
          </p>
          <input
            type='date'
            value={dateStr}
            onChange={(e) => {
              if (e.target.value) setDateStr(e.target.value);
            }}
            className='border-b border-cream-mid bg-transparent pb-2 font-mono text-label text-navy focus:outline-none focus:border-navy'
          />
        </div>
        <span className='font-serif italic text-base text-navy/50 pb-2'>
          {isToday ? 'Today — ' : ''}
          {format(new Date(dateStr + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
        </span>
        {isLoading && (
          <span className='font-mono text-label uppercase tracking-[0.2em] text-sand pb-2 animate-pulse'>
            Loading…
          </span>
        )}
      </div>

      {message && (
        <div
          className={[
            'mb-6 px-4 py-3 font-mono text-label uppercase tracking-[0.15em]',
            message.isError
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-sage/10 text-sage border border-sage/30',
          ].join(' ')}
        >
          {message.text}
        </div>
      )}

      <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/40 mb-4'>
        {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
      </p>

      {bookings.length === 0 ? (
        <EmptyState text='No bookings on this date.' />
      ) : (
        <div className='space-y-2'>
          {bookings.map((booking) => (
            <ReservationRow
              key={booking.id}
              booking={booking}
              run={run}
              isPending={isPending}
              showCancel={isToday}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationRow({
  booking,
  run,
  isPending,
  showCancel = true,
}: {
  booking: AdminBooking;
  run: ReturnType<typeof useActionState>['run'];
  isPending: boolean;
  showCancel?: boolean;
}) {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  return (
    <div className='bg-white border border-cream-mid px-4 sm:px-5 py-4'>
      <div className='flex items-start gap-4 sm:gap-6 min-w-0'>
        <div className='flex-shrink-0'>
          <p className='font-mono text-label text-gold uppercase tracking-[0.15em]'>
            {format(start, 'h:mm a')}
          </p>
          <p className='font-mono text-label text-navy/55'>
            – {format(end, 'h:mm a')}
          </p>
        </div>

        <div className='flex-shrink-0'>
          <p className='font-mono text-label uppercase tracking-[0.15em] text-navy'>
            {booking.bays?.name ?? 'Unknown Bay'}
          </p>
          <p className='font-mono text-label text-navy/55'>
            {booking.duration_minutes} min
          </p>
        </div>

        <div className='min-w-0 flex-1'>
          <p className='font-serif text-sm text-navy font-light truncate'>
            {booking.members?.full_name ?? 'Unknown member'}
          </p>
          {booking.guests?.length > 0 && (
            <p className='font-mono text-label text-navy/55 truncate'>
              + {booking.guests.map((g) => g.name).join(', ')}
            </p>
          )}
        </div>

        {showCancel && (
          <button
            disabled={isPending}
            onClick={() => {
              const who = booking.members?.full_name ?? 'this member';
              if (
                !confirm(
                  `Cancel ${who}'s booking at ${format(start, 'h:mm a')}?`,
                )
              )
                return;
              run(() => cancelBookingAdminAction(booking.id));
            }}
            className='flex-shrink-0 font-mono text-label uppercase tracking-[0.15em] text-red-400 hover:text-red-700 transition-colors disabled:opacity-40'
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
