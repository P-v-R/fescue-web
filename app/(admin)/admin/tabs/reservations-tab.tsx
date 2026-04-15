'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { format, startOfDay } from 'date-fns';
import type { AdminBooking } from '@/lib/supabase/queries/bookings';
import { useActionState } from '../hooks/use-action-state';
import {
  AdminSection,
  StatusMessage,
  ConfirmButton,
  AdminEmpty,
} from '../components/admin-ui';
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
    <div className='space-y-6'>
      <StatusMessage message={message} />

      <AdminSection
        icon='📅'
        title='Reservations by Date'
        help="View all bookings for any day. You can cancel a booking on today's date if needed."
      >
        {/* Date picker row */}
        <div className='flex items-end gap-3 mb-6 flex-wrap'>
          <div>
            <p className='font-mono text-[10px] uppercase tracking-[0.2em] text-navy/40 mb-1.5'>
              Select Date
            </p>
            <input
              type='date'
              value={dateStr}
              onChange={(e) => {
                if (e.target.value) setDateStr(e.target.value);
              }}
              className='border border-cream-mid bg-white px-3 py-2 font-mono text-sm text-navy focus:outline-none focus:border-navy transition-colors'
            />
          </div>
          <button
            type='button'
            onClick={() => setDateStr(todayStr)}
            className='bg-navy text-cream font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 hover:opacity-90 transition-opacity'
          >
            Today
          </button>
          {isLoading && (
            <span className='font-mono text-[10px] uppercase tracking-[0.2em] text-sand animate-pulse pb-1'>
              Loading…
            </span>
          )}
        </div>

        {/* Formatted date heading */}
        <div className='mb-4'>
          <p className='font-serif text-lg text-navy font-light'>
            {isToday && (
              <span className='font-mono text-[10px] uppercase tracking-[0.2em] text-gold mr-2 align-middle'>
                Today
              </span>
            )}
            {format(new Date(dateStr + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
          </p>
          <p className='font-mono text-[10px] uppercase tracking-[0.2em] text-navy/40 mt-1'>
            {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} on this date
          </p>
        </div>

        {/* Booking list */}
        {bookings.length === 0 ? (
          <AdminEmpty
            text='No bookings on this date.'
            subtext='Members book through the Reservations page.'
          />
        ) : (
          <div className='space-y-3'>
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
      </AdminSection>
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
        {/* Time */}
        <div className='flex-shrink-0 w-24'>
          <p className='font-mono text-xs text-gold uppercase tracking-[0.12em]'>
            {format(start, 'h:mm a')}
          </p>
          <p className='font-mono text-xs text-navy/45'>
            – {format(end, 'h:mm a')}
          </p>
          <p className='font-mono text-[10px] text-navy/30 mt-0.5'>
            {booking.duration_minutes} min
          </p>
        </div>

        {/* Bay */}
        <div className='flex-shrink-0 w-20'>
          <p className='font-mono text-xs uppercase tracking-[0.12em] text-navy'>
            {booking.bays?.name ?? 'Unknown Bay'}
          </p>
        </div>

        {/* Member + guests */}
        <div className='min-w-0 flex-1'>
          <p className='font-serif text-sm text-navy font-light truncate'>
            {booking.members?.full_name ?? 'Unknown member'}
          </p>
          {booking.guests?.length > 0 && (
            <p className='font-mono text-[10px] text-navy/45 truncate mt-0.5'>
              + {booking.guests.map((g) => g.name).join(', ')}
            </p>
          )}
        </div>

        {/* Cancel */}
        {showCancel && (
          <div className='flex-shrink-0'>
            <ConfirmButton
              disabled={isPending}
              onConfirm={() => run(() => cancelBookingAdminAction(booking.id))}
              label='Cancel Booking'
              confirmLabel='Yes, Cancel'
              confirmMessage='Cancel this booking? The member will not be automatically notified.'
              variant='danger'
            />
          </div>
        )}
      </div>
    </div>
  );
}
