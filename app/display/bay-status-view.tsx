'use client';

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { addMinutes } from 'date-fns';
import type { Bay, BookingWithMember } from '@/lib/supabase/types';
import { SLOT_MINUTES } from '@/lib/utils/time-slots';
import { getWindowSlots, formatTimeLabel } from '@/lib/utils/display';

type Props = {
  bays: Bay[];
  bookings: BookingWithMember[];
};

/** "6:00 PM" → "6:00" — drops the AM/PM for compact in-grid time ranges. */
function shortTime(date: Date): string {
  return date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .replace(/\s?[AP]M$/i, '');
}

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

  const clockStr = useMemo(
    () =>
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    [now],
  );
  const dateStr = useMemo(
    () =>
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [now],
  );

  const nowSlotIdx = useMemo(
    () =>
      slots.findIndex(
        (s) =>
          s.getTime() <= now.getTime() &&
          now.getTime() < addMinutes(s, SLOT_MINUTES).getTime(),
      ),
    [slots, now],
  );

  // Live "is this bay free right now?" status shown under each column header.
  const bayStatus = useMemo(() => {
    const map = new Map<string, { inUse: boolean; until: Date | null }>();
    for (const bay of activeBays) {
      const current = bookings.find(
        (b) =>
          b.bay_id === bay.id &&
          new Date(b.start_time).getTime() <= now.getTime() &&
          now.getTime() < new Date(b.end_time).getTime(),
      );
      map.set(bay.id, {
        inUse: Boolean(current),
        until: current ? new Date(current.end_time) : null,
      });
    }
    return map;
  }, [activeBays, bookings, now]);

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
  useLayoutEffect(() => {
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
      <div className='flex items-center justify-between px-12 py-5 border-b border-cream/10'>
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
            <p className='font-serif text-cream text-3xl leading-none tracking-wide'>
              Fescue Golf Club
            </p>
            <p className='font-mono text-[11px] uppercase tracking-[0.28em] text-sand mt-1.5'>
              Bay Schedule
            </p>
          </div>
        </div>
        <div className='text-right'>
          <p className='font-mono text-4xl font-medium tracking-[0.04em] text-cream tabular-nums'>
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
          <>
            <div
              className='absolute left-0 right-0 pointer-events-none z-10'
              style={{ top: nowLineTop, height: 3, background: 'var(--gold)' }}
            />
            <div
              className='absolute z-20 pointer-events-none font-mono text-sm font-medium uppercase tracking-[0.16em] whitespace-nowrap'
              style={{
                top: nowLineTop,
                left: 0,
                transform: 'translateY(-50%)',
                background: 'var(--gold)',
                color: 'var(--navy-dark)',
                padding: '3px 12px',
              }}
            >
              Now · {clockStr}
            </div>
          </>
        )}
        <table
          className='w-full border-collapse'
          style={{ height: '100%', tableLayout: 'fixed' }}
        >
          <colgroup>
            <col style={{ width: '150px' }} />
            {activeBays.map((bay) => (
              <col key={bay.id} />
            ))}
          </colgroup>

          {/* Column headers */}
          <thead ref={theadRef}>
            <tr>
              <th className='bg-navy-dark px-4 py-5 text-left font-mono text-2xl uppercase tracking-[0.22em] text-cream/40 border-r border-cream/30'>
                Time
              </th>
              {activeBays.map((bay, i) => {
                const status = bayStatus.get(bay.id);
                const inUse = status?.inUse ?? false;
                return (
                  <th
                    key={bay.id}
                    className={[
                      'bg-navy-dark px-4 py-5 text-center align-top',
                      i < activeBays.length - 1 ? 'border-r border-cream/30' : '',
                    ].join(' ')}
                  >
                    <p className='font-mono text-2xl uppercase tracking-[0.22em] text-cream'>
                      {bay.name}
                    </p>
                    <span className='mt-2.5 inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.18em]'>
                      <span
                        className='inline-block h-2 w-2 rounded-full'
                        style={{
                          background: inUse
                            ? 'rgba(245,240,232,0.35)'
                            : 'var(--gold-light)',
                        }}
                      />
                      <span
                        style={{
                          color: inUse
                            ? 'rgba(245,240,232,0.45)'
                            : 'var(--gold-light)',
                        }}
                      >
                        {inUse && status?.until
                          ? `In use · til ${shortTime(status.until)}`
                          : 'Open now'}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {slots.map((slotTime, slotIdx) => {
              const isHour = slotTime.getMinutes() === 0;
              const borderTopStyle = isHour
                ? '1px solid rgba(200,184,154,0.35)'
                : '1px solid rgba(200,184,154,0.12)';

              return (
                <tr
                  key={slotTime.getTime()}
                  style={{ height: `${100 / slots.length}%` }}
                >
                  {/* Time label */}
                  <td
                    className='px-4 align-top pt-2 border-r border-cream/30'
                    style={{ borderTop: borderTopStyle }}
                  >
                    <span
                      className={[
                        'font-mono tracking-[0.06em]',
                        isHour
                          ? 'text-lg text-cream/70'
                          : 'text-base text-cream/35',
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
                        ? '1px solid rgba(200,184,154,0.45)'
                        : undefined;

                    const cellData = cellMap.get(key);

                    if (cellData) {
                      const { booking, span } = cellData;
                      const memberName = (
                        booking.members?.full_name ?? 'Member'
                      ).split(' ')[0];
                      const timeRange = `${shortTime(new Date(booking.start_time))} – ${shortTime(new Date(booking.end_time))}`;

                      return (
                        <td
                          key={bay.id}
                          rowSpan={span}
                          className='px-3 text-center align-middle'
                          style={{
                            borderTop: borderTopStyle,
                            borderRight,
                            background: 'rgba(107,135,95,0.55)',
                            boxShadow: 'inset 4px 0 0 var(--gold)',
                          }}
                        >
                          <p className='font-serif text-4xl text-cream leading-none'>
                            {memberName}
                          </p>
                          <p className='mt-2.5 font-mono text-base tracking-[0.12em] text-cream/60'>
                            {timeRange}
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
                          background: 'rgba(255,255,255,0.02)',
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
      <div className='flex items-center gap-3 px-12 py-3.5 border-t border-cream/10'>
        <div className='flex-1 h-px bg-cream/15' />
        <div className='w-1.5 h-1.5 bg-gold/40 rotate-45 shrink-0' />
        <div className='flex-1 h-px bg-cream/15' />
      </div>
    </div>
  );
}
