'use client';

import { useMemo, useEffect, useRef } from 'react';
import { isBefore } from 'date-fns';
import {
  generateTimeSlots,
  durationToSpan,
  timeToSlotIndex,
  formatSlot,
} from '@/lib/utils/time-slots';
import type { Bay, BookingWithMember } from '@/lib/supabase/types';
import { findBlackout, type BlackoutPeriod } from '@/lib/utils/blackout';

type SelectedSlot = {
  bayId: string;
  bayName: string;
  startTime: Date;
};

type CellState =
  | { type: 'available' }
  | { type: 'past' }
  | { type: 'booked-mine'; booking: BookingWithMember; span: number }
  | { type: 'booked-other'; booking: BookingWithMember; span: number }
  | { type: 'continuation' };

type Props = {
  bays: Bay[];
  bookings: BookingWithMember[];
  date: Date;
  userId: string;
  onSlotClick: (slot: SelectedSlot) => void;
  onBookingClick?: (booking: BookingWithMember, bayName: string) => void;
  blackoutPeriods?: BlackoutPeriod[];
};

export function BayGrid({ bays, bookings, date, userId, onSlotClick, onBookingClick, blackoutPeriods = [] }: Props) {
  const now = new Date();
  const slots = useMemo(() => generateTimeSlots(date), [date]);

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const currentRowRef = useRef<HTMLTableRowElement>(null)
  const currentSlotIdx = useMemo(
    () => slots.findIndex((slot) => !isBefore(slot, new Date())),
    [slots],
  )

  useEffect(() => {
    const container = scrollContainerRef.current
    const row = currentRowRef.current
    if (container && row) {
      container.scrollTop = row.offsetTop - 80
    }
  }, [date])

  // Build a map from "slotIdx-bayIdx" to booking start, and a set of continuation keys
  const { bookingStarts, continuations } = useMemo(() => {
    const bookingStarts = new Map<string, { booking: BookingWithMember; span: number }>();
    const continuations = new Set<string>();

    for (const booking of bookings) {
      const bayIdx = bays.findIndex((b) => b.id === booking.bay_id);
      if (bayIdx === -1) continue;

      const slotIdx = timeToSlotIndex(new Date(booking.start_time));
      const span = durationToSpan(booking.duration_minutes);

      if (slotIdx < 0 || slotIdx >= slots.length) continue;

      bookingStarts.set(`${slotIdx}-${bayIdx}`, { booking, span });
      for (let i = 1; i < span; i++) {
        continuations.add(`${slotIdx + i}-${bayIdx}`);
      }
    }

    return { bookingStarts, continuations };
  }, [bookings, bays, slots]);

  return (
    <div className='overflow-x-auto rounded-sm border border-sand/40'>
      {/* Mobile scroll hint */}
      <p className='sm:hidden px-3 py-1.5 bg-cream-mid/60 text-center font-mono text-label text-sand/70 uppercase tracking-[0.15em] border-b border-sand/30'>
        ← Scroll to see all bays →
      </p>
      <div ref={scrollContainerRef} className='max-h-[70vh] sm:max-h-[75vh] overflow-y-auto'>
        <table className='w-full border-collapse text-sm min-w-[600px]'>
          {/* Column headers */}
          <thead className='sticky top-0 z-10 bg-navy-dark'>
            <tr>
              <th className='w-20 px-3 py-3 text-left font-mono text-label uppercase tracking-[0.22em] text-cream/60 border-r border-[rgba(255,255,255,0.10)]'>
                Time
              </th>
              {bays.map((bay) => (
                <th
                  key={bay.id}
                  className='px-3 py-3 text-center font-mono text-label uppercase tracking-[0.22em] text-cream border-r border-[rgba(255,255,255,0.10)] last:border-r-0'
                >
                  {bay.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {slots.map((slotTime, slotIdx) => {
              const isPastHour = isBefore(slotTime, now);
              const isHour = slotTime.getMinutes() === 0;

              return (
                <tr
                  key={slotIdx}
                  ref={slotIdx === currentSlotIdx ? currentRowRef : undefined}
                  className={isHour ? 'border-t border-sand/40' : ''}
                >
                  {/* Time label */}
                  <td
                    className={[
                      'px-3 py-0 border-r border-sand/35 text-right whitespace-nowrap',
                      'font-mono text-label tracking-[0.08em]',
                      isHour ? 'pt-2 pb-1' : 'py-1',
                      isPastHour ? 'text-navy/35' : 'text-navy/65',
                    ].join(' ')}
                  >
                    {isHour ? formatSlot(slotTime) : ''}
                  </td>

                  {/* Bay cells */}
                  {bays.map((bay, bayIdx) => {
                    const key = `${slotIdx}-${bayIdx}`;

                    // Skip — covered by a rowSpan above
                    if (continuations.has(key)) return null;

                    const bookingData = bookingStarts.get(key);

                    // Booked cell
                    if (bookingData) {
                      const { booking, span } = bookingData;
                      const isMine = booking.member_id === userId;

                      const memberName = booking.members?.full_name ?? 'Member'
                      const guestCount = booking.guests?.length ?? 0

                      return (
                        <td
                          key={bay.id}
                          rowSpan={span}
                          onClick={isMine && onBookingClick ? () => onBookingClick(booking, bay.name) : undefined}
                          className={[
                            'px-2 py-1 border-r border-sand/35 last:border-r-0 border-b border-b-sand/20',
                            'align-top text-center',
                            isMine ? 'booking-mine bg-navy' : 'bg-navy/[0.22]',
                            isMine && onBookingClick ? 'cursor-pointer hover:bg-navy-mid transition-colors' : '',
                          ].join(' ')}
                        >
                          <div className='flex flex-col items-center gap-0.5 pt-1'>
                            <span
                              className={[
                                'font-mono text-label uppercase tracking-[0.18em]',
                                isMine ? 'text-cream/90' : 'text-navy/80',
                              ].join(' ')}
                            >
                              {isMine ? 'My Booking' : memberName}
                            </span>
                            {guestCount > 0 && (
                              <span
                                className={[
                                  'font-mono text-label tracking-[0.12em]',
                                  isMine ? 'text-cream/60' : 'text-navy/55',
                                ].join(' ')}
                              >
                                +{guestCount} {guestCount === 1 ? 'guest' : 'guests'}
                              </span>
                            )}
                            {isMine && guestCount === 0 && (
                              <span className='font-serif text-label text-cream/60 italic'>
                                {booking.duration_minutes}m
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    }

                    // Past / available / blacked-out cell
                    const blackout = !isPastHour ? findBlackout(slotTime, bay.id, blackoutPeriods) : null;
                    const isBlackedOut = !!blackout;

                    return (
                      <td
                        key={bay.id}
                        onClick={
                          isPastHour || isBlackedOut
                            ? undefined
                            : () =>
                                onSlotClick({
                                  bayId: bay.id,
                                  bayName: bay.name,
                                  startTime: slotTime,
                                })
                        }
                        className={[
                          'border-r border-sand/35 last:border-r-0 border-b border-b-sand/20',
                          'h-7 transition-[background-color,box-shadow] duration-100',
                          isPastHour
                            ? 'bg-navy/[0.08] cursor-default'
                            : isBlackedOut
                              ? 'bg-gold/25 cursor-not-allowed'
                              : 'bg-white cursor-pointer hover:bg-gold/[0.14] hover:[box-shadow:inset_0_0_0_1px_rgba(184,150,60,0.45)] active:bg-gold/[0.22]',
                        ].join(' ')}
                      >
                        {isBlackedOut && isHour && (
                          <span className='block px-1.5 pt-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-gold/80 truncate leading-tight'>
                            {blackout.reason ?? 'Unavailable'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className='flex flex-wrap items-center gap-6 px-4 py-2.5 bg-cream border-t border-sand/30'>
        <LegendItem color='bg-white border border-sand/40' label='Available' />
        <LegendItem color='booking-mine bg-navy' label='My booking' />
        <LegendItem color='bg-navy/[0.22] border border-navy/20' label='Booked' />
        <LegendItem color='bg-navy/[0.08] border border-sand/35' label='Past' />
        <LegendItem color='bg-gold/25 border border-gold/40' label='Blocked' />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className='flex items-center gap-2'>
      <span className={`w-3 h-3 rounded-sm ${color}`} />
      <span className='font-mono text-label uppercase tracking-[0.18em] text-sand'>
        {label}
      </span>
    </div>
  );
}
