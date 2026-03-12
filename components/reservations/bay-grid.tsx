'use client';

import { useMemo } from 'react';
import { isBefore } from 'date-fns';
import {
  generateTimeSlots,
  durationToSpan,
  timeToSlotIndex,
  formatSlot,
} from '@/lib/utils/time-slots';
import type { Bay, Booking } from '@/lib/supabase/types';
import { findBlackout, type BlackoutPeriod } from '@/lib/utils/blackout';

type SelectedSlot = {
  bayId: string;
  bayName: string;
  startTime: Date;
};

type CellState =
  | { type: 'available' }
  | { type: 'past' }
  | { type: 'booked-mine'; booking: Booking; span: number }
  | { type: 'booked-other'; booking: Booking; span: number }
  | { type: 'continuation' };

type Props = {
  bays: Bay[];
  bookings: Booking[];
  date: Date;
  userId: string;
  onSlotClick: (slot: SelectedSlot) => void;
  blackoutPeriods?: BlackoutPeriod[];
};

export function BayGrid({ bays, bookings, date, userId, onSlotClick, blackoutPeriods = [] }: Props) {
  const now = new Date();
  const slots = useMemo(() => generateTimeSlots(date), [date]);

  // Build a map from "slotIdx-bayIdx" to booking start, and a set of continuation keys
  const { bookingStarts, continuations } = useMemo(() => {
    const bookingStarts = new Map<string, { booking: Booking; span: number }>();
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
    <div className='overflow-x-auto rounded-sm border border-cream-mid'>
      {/* Mobile scroll hint */}
      <p className='sm:hidden px-3 py-1.5 bg-cream-mid/60 text-center font-mono text-label text-sand/70 uppercase tracking-[0.15em] border-b border-cream-mid'>
        ← Scroll to see all bays →
      </p>
      <div className='max-h-[70vh] sm:max-h-[75vh] overflow-y-auto'>
        <table className='w-full border-collapse text-sm min-w-[600px]'>
          {/* Column headers */}
          <thead className='sticky top-0 z-10 bg-navy-dark'>
            <tr>
              <th className='w-20 px-3 py-3 text-left font-mono text-label uppercase tracking-[0.22em] text-cream/50 border-r border-[rgba(255,255,255,0.06)]'>
                Time
              </th>
              {bays.map((bay) => (
                <th
                  key={bay.id}
                  className='px-3 py-3 text-center font-mono text-label uppercase tracking-[0.22em] text-cream border-r border-[rgba(255,255,255,0.06)] last:border-r-0'
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
                  className={isHour ? 'border-t border-sand/25' : ''}
                >
                  {/* Time label */}
                  <td
                    className={[
                      'px-3 py-0 border-r border-sand/20 text-right whitespace-nowrap',
                      'font-mono text-label tracking-[0.08em]',
                      isHour ? 'pt-2 pb-1' : 'py-1',
                      isPastHour ? 'text-navy/25' : 'text-navy/55',
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

                      return (
                        <td
                          key={bay.id}
                          rowSpan={span}
                          className={[
                            'px-2 py-1 border-r border-sand/20 last:border-r-0 border-b border-b-sand/10',
                            'align-top text-center',
                            isMine ? 'bg-navy' : 'bg-sand/20',
                          ].join(' ')}
                        >
                          <div className='flex flex-col items-center gap-0.5 pt-1'>
                            <span
                              className={[
                                'font-mono text-label uppercase tracking-[0.18em]',
                                isMine ? 'text-cream/90' : 'text-navy/60',
                              ].join(' ')}
                            >
                              {isMine ? 'My Booking' : 'Booked'}
                            </span>
                            {isMine && (
                              <span className='font-serif text-label text-cream/70 italic'>
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
                          'border-r border-sand/20 last:border-r-0 border-b border-b-sand/10',
                          'h-7 transition-colors duration-150',
                          isPastHour
                            ? 'bg-navy/[0.04] cursor-default'
                            : isBlackedOut
                              ? 'bg-gold/20 cursor-not-allowed'
                              : 'bg-white cursor-pointer hover:bg-gold/[0.07] active:bg-gold/[0.14]',
                        ].join(' ')}
                      >
                        {isBlackedOut && isHour && (
                          <span className='block px-1.5 pt-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-gold/70 truncate leading-tight'>
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
      <div className='flex flex-wrap items-center gap-6 px-4 py-2.5 bg-cream border-t border-cream-mid'>
        <LegendItem color='bg-white border border-sand/30' label='Available' />
        <LegendItem color='bg-navy' label='My booking' />
        <LegendItem color='bg-sand/20 border border-sand/30' label='Booked' />
        <LegendItem color='bg-navy/[0.04] border border-sand/20' label='Past' />
        <LegendItem color='bg-gold/20 border border-gold/30' label='Blocked' />
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
