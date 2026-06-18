'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { addMinutes } from 'date-fns';
import type { Bay, BookingWithMember } from '@/lib/supabase/types';
import { SLOT_MINUTES } from '@/lib/utils/time-slots';
import { getWindowSlots, formatTimeLabel } from '@/lib/utils/display';

type Props = {
  bays: Bay[];
  bookings: BookingWithMember[];
};

export function BayStatusView({ bays, bookings }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const gridRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const [nowLineTop, setNowLineTop] = useState<number | null>(null);

  const activeBays = useMemo(() => bays.filter((b) => b.is_active), [bays]);
  const slots = useMemo(() => getWindowSlots(now), [now]);

  const clockStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const nowSlotIdx = useMemo(
    () => slots.findIndex((s) => s <= now && now < addMinutes(s, SLOT_MINUTES)),
    [slots, now],
  );

  const { cellMap, continuations } = useMemo(() => {
    const cellMap = new Map<
      string,
      { booking: BookingWithMember; span: number }
    >();
    const continuations = new Set<string>();

    for (const booking of bookings) {
      const bayIdx = activeBays.findIndex((b) => b.id === booking.bay_id);
      if (bayIdx === -1) continue;

      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);

      let firstVisibleIdx = -1;
      let visibleSpan = 0;

      for (let i = 0; i < slots.length; i++) {
        const slotStart = slots[i];
        const slotEnd = addMinutes(slotStart, SLOT_MINUTES);
        if (slotEnd <= bookingStart) continue;
        if (slotStart >= bookingEnd) break;
        if (firstVisibleIdx === -1) firstVisibleIdx = i;
        visibleSpan++;
      }

      if (firstVisibleIdx === -1) continue;

      cellMap.set(`${firstVisibleIdx}-${bayIdx}`, {
        booking,
        span: visibleSpan,
      });
      for (let i = 1; i < visibleSpan; i++) {
        continuations.add(`${firstVisibleIdx + i}-${bayIdx}`);
      }
    }

    return { cellMap, continuations };
  }, [bookings, activeBays, slots]);

  // Recompute the floating NOW line position every time `now` ticks
  useEffect(() => {
    const grid = gridRef.current;
    const thead = theadRef.current;
    if (!grid || !thead || nowSlotIdx < 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNowLineTop(null);
      return;
    }
    const theadHeight = thead.clientHeight;
    const tbodyHeight = grid.clientHeight - theadHeight;
    const rowHeight = tbodyHeight / slots.length;
    const minutesFraction = (now.getMinutes() % 30) / 30;
    setNowLineTop(theadHeight + (nowSlotIdx + minutesFraction) * rowHeight);
  }, [now, nowSlotIdx, slots.length]);

  return (
    <div className='flex flex-col h-full'>
      {/* Page header */}
      <div className='flex items-center justify-between px-12 py-5 border-b border-sand/30'>
        <div className='flex items-center gap-4'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src='/quail-alt.png'
            alt='Fescue Golf Club'
            width={52}
            height={52}
            style={{ objectFit: 'contain' }}
          />
          <div>
            <p className='font-serif text-navy text-3xl leading-none tracking-wide'>
              Fescue Golf Club
            </p>
            <p className='font-mono text-[11px] uppercase tracking-[0.28em] text-sand mt-1.5'>
              Bay Schedule
            </p>
          </div>
        </div>
        <div className='text-right'>
          <p className='font-mono text-4xl font-medium tracking-[0.04em] text-navy tabular-nums'>
            {clockStr}
          </p>
          <p className='font-mono text-[11px] uppercase tracking-[0.22em] text-sand mt-1'>
            {dateStr}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className='flex-1 overflow-hidden relative' ref={gridRef}>
        {/* Floating NOW line — absolutely positioned at exact current time */}
        {nowLineTop !== null && (
          <div
            className='absolute left-0 right-0 pointer-events-none z-10 h-[2px]'
            style={{
              top: nowLineTop,
              background: 'var(--color-gold)',
              opacity: 0.3,
            }}
          />
        )}
        <table
          className='w-full border-collapse'
          style={{ height: '100%', tableLayout: 'fixed' }}
        >
          <colgroup>
            <col style={{ width: '108px' }} />
            {activeBays.map((bay) => (
              <col key={bay.id} />
            ))}
          </colgroup>

          {/* Column headers */}
          <thead ref={theadRef}>
            <tr>
              <th className='bg-navy-dark px-4 py-4 text-left font-mono text-sm uppercase tracking-[0.28em] text-cream/40 border-r border-cream/10'>
                Time
              </th>
              {activeBays.map((bay, i) => (
                <th
                  key={bay.id}
                  className={[
                    'bg-navy-dark px-4 py-4 text-center font-mono text-sm uppercase tracking-[0.28em] text-cream',
                    i < activeBays.length - 1 ? 'border-r border-cream/10' : '',
                  ].join(' ')}
                >
                  {bay.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {slots.map((slotTime, slotIdx) => {
              const isHour = slotTime.getMinutes() === 0;
              const borderTopStyle = isHour
                ? '1px solid rgba(200,184,154,0.35)'
                : '1px solid rgba(200,184,154,0.12)';

              return (
                <tr key={slotIdx} style={{ height: `${100 / slots.length}%` }}>
                  {/* Time label */}
                  <td
                    className='px-4 align-top pt-2 border-r border-sand/20'
                    style={{ borderTop: borderTopStyle }}
                  >
                    <span
                      className={[
                        'font-mono tracking-[0.06em]',
                        isHour
                          ? 'text-sm text-navy/80'
                          : 'text-xs text-navy/50',
                      ].join(' ')}
                    >
                      {formatTimeLabel(slotTime)}
                    </span>
                  </td>

                  {/* Bay cells */}
                  {activeBays.map((bay, bayIdx) => {
                    const key = `${slotIdx}-${bayIdx}`;

                    if (continuations.has(key)) return null;

                    const borderRight =
                      bayIdx < activeBays.length - 1
                        ? '1px solid rgba(200,184,154,0.2)'
                        : undefined;

                    const cellData = cellMap.get(key);

                    if (cellData) {
                      const { booking, span } = cellData;
                      const memberName = (
                        booking.members?.full_name ?? 'Member'
                      ).split(' ')[0];

                      return (
                        <td
                          key={bay.id}
                          rowSpan={span}
                          className='px-3 text-center align-middle'
                          style={{
                            borderTop: borderTopStyle,
                            borderRight,
                            background: 'rgba(92,122,82,0.18)',
                          }}
                        >
                          <p className='font-serif text-3xl text-navy/80 leading-none'>
                            {memberName}
                          </p>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={bay.id}
                        style={{
                          borderTop: borderTopStyle,
                          borderRight,
                          background: 'rgba(255,255,255,0.55)',
                        }}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer ornament */}
      <div className='flex items-center gap-3 px-12 py-3.5 border-t border-sand/20'>
        <div className='flex-1 h-px bg-sand/20' />
        <div className='w-1.5 h-1.5 bg-gold/40 rotate-45 shrink-0' />
        <div className='flex-1 h-px bg-sand/20' />
      </div>
    </div>
  );
}
