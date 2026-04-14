'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { BlackoutPeriod } from '@/lib/supabase/queries/blackout-periods';
import type { Bay } from '@/lib/supabase/types';
import { useActionState } from '../hooks/use-action-state';
import {
  AdminSection,
  StatusMessage,
  ConfirmButton,
  FieldLabel,
  inputCls,
  selectCls,
  AdminEmpty,
} from '../components/admin-ui';
import { createBlackoutAction, deleteBlackoutAction } from '../actions';

const TIME_OPTIONS = Array.from({ length: 29 }, (_, i) => {
  const totalMins = 8 * 60 + i * 30;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const label = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return { value, label };
});

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function BlackoutDatesTab({
  blackoutPeriods,
  bays,
}: {
  blackoutPeriods: BlackoutPeriod[];
  bays: Bay[];
}) {
  const { message, isPending, run } = useActionState();
  const [date, setDate] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('22:00');
  const [allBays, setAllBays] = useState(true);
  const [selectedBayIds, setSelectedBayIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  function toggleBay(id: string) {
    setSelectedBayIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set('date', date);
    fd.set('all_day', String(allDay));
    fd.set('all_bays', String(allBays));
    fd.set('start_time', allDay ? '' : startTime);
    fd.set('end_time', allDay ? '' : endTime);
    fd.set('bay_ids', JSON.stringify(allBays ? [] : selectedBayIds));
    fd.set('reason', reason);
    run(async () => {
      const result = await createBlackoutAction(fd);
      if (!result.error) {
        setDate('');
        setReason('');
        setSelectedBayIds([]);
      }
      return result;
    });
  }

  return (
    <div className='space-y-6'>
      <StatusMessage message={message} />

      {/* Block a date form */}
      <AdminSection
        icon='🚫'
        title='Block Bookings on a Date'
        help='Use this to prevent members from booking on a specific date or time — for example, if the club is closed for an event or maintenance.'
      >
        <form onSubmit={handleSubmit} className='space-y-5 max-w-lg'>
          {/* Date */}
          <div>
            <FieldLabel
              required
              help="The date you want to block. Members won't be able to book during this period."
            >
              Date
            </FieldLabel>
            <input
              type='date'
              name='date'
              value={date}
              min={today}
              required
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* All day toggle */}
          <div>
            <FieldLabel>Time</FieldLabel>
            <label className='flex items-center gap-2.5 cursor-pointer mb-3'>
              <input
                type='checkbox'
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className='accent-navy w-4 h-4'
              />
              <span className='font-sans text-sm text-navy'>Block the entire day</span>
            </label>
            {!allDay && (
              <div className='flex items-center gap-3'>
                <div>
                  <p className='font-mono text-[10px] uppercase tracking-[0.15em] text-navy/40 mb-1'>From</p>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={selectCls}
                  >
                    {TIME_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span className='font-mono text-xs text-navy/30 mt-5'>to</span>
                <div>
                  <p className='font-mono text-[10px] uppercase tracking-[0.15em] text-navy/40 mb-1'>To</p>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={selectCls}
                  >
                    {TIME_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Bays */}
          <div>
            <FieldLabel>Which bays to block?</FieldLabel>
            <label className='flex items-center gap-2.5 cursor-pointer mb-3'>
              <input
                type='checkbox'
                checked={allBays}
                onChange={(e) => setAllBays(e.target.checked)}
                className='accent-navy w-4 h-4'
              />
              <span className='font-sans text-sm text-navy'>All bays (entire club)</span>
            </label>
            {!allBays && (
              <div className='flex flex-wrap gap-3'>
                {bays.map((bay) => (
                  <label key={bay.id} className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={selectedBayIds.includes(bay.id)}
                      onChange={() => toggleBay(bay.id)}
                      className='accent-navy w-4 h-4'
                    />
                    <span className='font-sans text-sm text-navy'>{bay.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <FieldLabel help="Optional note — only visible to admins. E.g. 'Club championship', 'Bay 1 maintenance'">
              Reason <span className='normal-case text-navy/30 font-sans text-[10px]'>(optional)</span>
            </FieldLabel>
            <input
              type='text'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='e.g. Holiday party, Bay maintenance…'
              className={inputCls}
            />
          </div>

          <button
            type='submit'
            disabled={isPending || !date}
            className='bg-navy text-cream font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50'
          >
            {isPending ? 'Saving…' : 'Block This Date →'}
          </button>
        </form>
      </AdminSection>

      {/* Scheduled blocks */}
      <AdminSection
        icon='📋'
        title={`Scheduled Blocks (${blackoutPeriods.length})`}
      >
        {blackoutPeriods.length === 0 ? (
          <AdminEmpty
            text='No blocked periods scheduled.'
            subtext='Use the form above to block a date.'
          />
        ) : (
          <div className='space-y-3'>
            {blackoutPeriods.map((p) => (
              <div key={p.id} className='border border-cream-mid bg-white p-4'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='min-w-0 flex-1'>
                    {/* Date */}
                    <p className='font-serif text-base text-navy font-light'>
                      {format(new Date(p.date + 'T12:00:00'), 'EEE, MMMM d, yyyy')}
                    </p>
                    {/* Time */}
                    <p className='font-mono text-xs text-navy/55 mt-0.5'>
                      {p.start_time && p.end_time
                        ? `${fmtTime(p.start_time)} – ${fmtTime(p.end_time)}`
                        : 'All day'}
                    </p>
                    {/* Bays */}
                    <p className='font-mono text-xs text-navy/40 mt-0.5'>
                      {p.all_bays
                        ? 'All bays'
                        : bays
                            .filter((b) => p.bay_ids.includes(b.id))
                            .map((b) => b.name)
                            .join(', ') || '—'}
                    </p>
                    {/* Reason */}
                    {p.reason ? (
                      <p className='font-sans text-xs text-navy/50 mt-1 italic'>{p.reason}</p>
                    ) : (
                      <p className='font-sans text-xs text-navy/25 mt-1 italic'>Bay Unavailable</p>
                    )}
                  </div>
                  <ConfirmButton
                    disabled={isPending}
                    onConfirm={() => run(() => deleteBlackoutAction(p.id))}
                    label='Remove'
                    confirmLabel='Yes, Remove'
                    confirmMessage='Remove this blocked period? Members will be able to book again.'
                    variant='danger'
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
