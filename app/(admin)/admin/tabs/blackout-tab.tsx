'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { BlackoutPeriod } from '@/lib/supabase/queries/blackout-periods';
import type { Bay } from '@/lib/supabase/types';
import { useActionState } from '../hooks/use-action-state';
import { SectionHeader } from '../components/section-header';
import { Table } from '../components/table';
import { EmptyState } from '../components/empty-state';
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
    <div className='space-y-10'>
      {message && (
        <div
          className={[
            'px-4 py-3 font-mono text-label uppercase tracking-[0.15em]',
            message.isError
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-sage/10 text-sage border border-sage/30',
          ].join(' ')}
        >
          {message.text}
        </div>
      )}

      <section>
        <SectionHeader
          label='Blackout'
          title='Block a Period'
          description='Block specific bays or all bays for a time range or full day.'
        />

        <form onSubmit={handleSubmit} className='space-y-5 max-w-lg'>
          <div>
            <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/40 mb-2'>
              Date
            </p>
            <input
              type='date'
              name='date'
              value={date}
              min={today}
              required
              onChange={(e) => setDate(e.target.value)}
              className='border-b border-cream-mid bg-transparent pb-2 font-mono text-label text-navy focus:outline-none focus:border-navy'
            />
          </div>

          <div>
            <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/40 mb-2'>
              Time
            </p>
            <label className='flex items-center gap-2 cursor-pointer mb-3'>
              <input
                type='checkbox'
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className='accent-navy'
              />
              <span className='font-mono text-label text-navy/70'>All day</span>
            </label>
            {!allDay && (
              <div className='flex items-center gap-3'>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className='border-b border-cream-mid bg-transparent pb-1 font-mono text-label text-navy focus:outline-none focus:border-navy'
                >
                  {TIME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className='font-mono text-label text-navy/30'>to</span>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className='border-b border-cream-mid bg-transparent pb-1 font-mono text-label text-navy focus:outline-none focus:border-navy'
                >
                  {TIME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/40 mb-2'>
              Bays
            </p>
            <label className='flex items-center gap-2 cursor-pointer mb-3'>
              <input
                type='checkbox'
                checked={allBays}
                onChange={(e) => setAllBays(e.target.checked)}
                className='accent-navy'
              />
              <span className='font-mono text-label text-navy/70'>All bays</span>
            </label>
            {!allBays && (
              <div className='flex flex-wrap gap-3'>
                {bays.map((bay) => (
                  <label key={bay.id} className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={selectedBayIds.includes(bay.id)}
                      onChange={() => toggleBay(bay.id)}
                      className='accent-navy'
                    />
                    <span className='font-mono text-label text-navy/70'>{bay.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/40 mb-2'>
              Reason{' '}
              <span className='normal-case text-navy/30'>(optional)</span>
            </p>
            <input
              type='text'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='e.g. Holiday party, Bay maintenance…'
              className='w-full border-b border-cream-mid bg-transparent pb-2 font-mono text-label text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy'
            />
          </div>

          <button
            type='submit'
            disabled={isPending || !date}
            className='bg-navy text-cream font-mono text-label uppercase tracking-[0.2em] px-5 py-2 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50'
          >
            {isPending ? 'Saving…' : 'Save Blackout'}
          </button>
        </form>
      </section>

      <section>
        <SectionHeader
          label='Scheduled'
          title={`Blocked Periods (${blackoutPeriods.length})`}
        />
        {blackoutPeriods.length === 0 ? (
          <EmptyState text='No blackout periods scheduled.' />
        ) : (
          <Table
            headers={['Date', 'Time', 'Bays', 'Reason', '']}
            rows={blackoutPeriods.map((p) => ({
              id: p.id,
              cells: [
                format(new Date(p.date + 'T12:00:00'), 'EEE, MMM d, yyyy'),
                p.start_time && p.end_time
                  ? `${fmtTime(p.start_time)} – ${fmtTime(p.end_time)}`
                  : 'All day',
                p.all_bays
                  ? 'All bays'
                  : bays
                      .filter((b) => p.bay_ids.includes(b.id))
                      .map((b) => b.name)
                      .join(', ') || '—',
                p.reason ?? (
                  <span className='text-navy/30 italic'>Bay Unavailable</span>
                ),
                <button
                  key={p.id}
                  disabled={isPending}
                  onClick={() => {
                    if (!confirm('Remove this blackout period?')) return;
                    run(() => deleteBlackoutAction(p.id));
                  }}
                  className='font-mono text-label uppercase tracking-[0.15em] text-red-400 hover:text-red-700 transition-colors disabled:opacity-40'
                >
                  Remove
                </button>,
              ],
            }))}
          />
        )}
      </section>
    </div>
  );
}
