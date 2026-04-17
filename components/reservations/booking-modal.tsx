'use client';

import { useState, useEffect } from 'react';
import { format, addMinutes } from 'date-fns';
import { createBookingAction } from '@/app/(member)/reservations/actions';
import { isWithinOperatingHours } from '@/lib/utils/time-slots';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Booking } from '@/lib/supabase/types';

type SelectedSlot = {
  bayId: string;
  bayName: string;
  startTime: Date;
};

type Props = {
  slot: SelectedSlot;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
  userId: string;
};

type GuestEntry = { name: string; email: string };


const DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hrs' },
  { value: 120, label: '2 hours' },
] as const;

type Duration = 30 | 60 | 90 | 120;

export function BookingModal({ slot, onClose, onSuccess }: Props) {
  const [duration, setDuration] = useState<Duration>(60);
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const endTime = addMinutes(slot.startTime, duration);
  const exceedsClose = !isWithinOperatingHours(slot.startTime, duration);

  function addGuest() {
    if (guests.length < 3)
      setGuests((prev) => [...prev, { name: '', email: '' }]);
  }

  function removeGuest(i: number) {
    setGuests((prev) => prev.filter((_, idx) => idx !== i));
    setError(null);
  }

  function updateGuest(i: number, field: keyof GuestEntry, value: string) {
    setGuests((prev) =>
      prev.map((g, idx) => (idx === i ? { ...g, [field]: value } : g)),
    );
  }

  async function handleSubmit() {
    if (exceedsClose) return;

    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];
      if (!g.name.trim()) {
        setError(`Please enter a name for guest ${i + 1}.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createBookingAction({
      bay_id: slot.bayId,
      start_time: slot.startTime.toISOString(),
      duration_minutes: duration,
      guests: guests.map((g) => ({
        name: g.name.trim(),
        ...(g.email.trim() ? { email: g.email.trim() } : {}),
      })),
    });

    if ('error' in result) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      onSuccess(result.booking);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-navy-dark/70 backdrop-blur-sm z-40'
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role='dialog'
        aria-modal='true'
        className='fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4'
      >
        <div
          className='relative bg-cream w-full sm:max-w-md max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl rounded-t-2xl sm:rounded-none'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Corner ticks */}
          <span className='absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/40' />
          <span className='absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/40' />
          <span className='absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/40' />
          <span className='absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/40' />

          {/* Close button */}
          <button
            onClick={onClose}
            className='absolute top-4 right-4 font-mono text-label uppercase tracking-[0.18em] text-sand hover:text-navy transition-colors'
          >
            ✕
          </button>

          <h2 className='font-serif text-heading font-light text-navy mb-6'>
            Book a Bay
          </h2>

          {/* Slot summary */}
          <div className='bg-cream-mid px-5 py-4 mb-6 grid grid-cols-3 gap-2'>
            <div>
              <p className='font-mono text-label uppercase tracking-[0.22em] text-sage mb-1'>
                Bay
              </p>
              <p className='font-serif text-xl font-light text-navy leading-tight'>
                {slot.bayName}
              </p>
            </div>
            <div>
              <p className='font-mono text-label uppercase tracking-[0.22em] text-sage mb-1'>
                Start
              </p>
              <p className='font-serif text-xl font-light text-navy leading-tight'>
                {format(slot.startTime, 'h:mm a')}
              </p>
            </div>
            <div>
              <p className='font-mono text-label uppercase tracking-[0.22em] text-sage mb-1'>
                Date
              </p>
              <p className='font-serif text-xl font-light text-navy leading-tight'>
                {format(slot.startTime, 'MMM d')}
              </p>
            </div>
          </div>

          {/* Duration selector */}
          <div className='mb-6'>
            <p className='font-mono text-label uppercase tracking-[0.28em] text-sage mb-3'>
              Duration
            </p>
            <div className='flex gap-2'>
              {DURATIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setDuration(value);
                    setError(null);
                  }}
                  className={[
                    'flex-1 py-2.5 font-mono text-label uppercase tracking-[0.18em] border transition-all duration-150',
                    duration === value
                      ? 'bg-navy text-cream border-navy shadow-[inset_0_0_0_1px_rgba(184,150,60,0.3)]'
                      : 'bg-transparent text-navy border-cream-mid hover:border-navy/40',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className='mt-2 flex flex-col gap-1'>
              <p
                className={[
                  'font-mono text-label tracking-[0.1em]',
                  exceedsClose ? 'text-red-500' : 'text-sand',
                ].join(' ')}
              >
                {exceedsClose
                  ? `Ends at ${format(endTime, 'h:mm a')} — exceeds 10pm closing time`
                  : `Ends at ${format(endTime, 'h:mm a')}`}
              </p>
              {duration === 120 && (
                <p className='font-mono text-label tracking-[0.1em] text-sand'>
                  2-hour sessions are intended for 2+ players
                </p>
              )}
            </div>
          </div>

          {/* Guests */}
          <div className='mb-6'>
            <div className='flex items-center justify-between mb-3'>
              <p className='font-mono text-label uppercase tracking-[0.28em] text-sage'>
                Guests{guests.length > 0 && ` (${guests.length}/3)`}
              </p>
              {guests.length < 3 && (
                <button
                  onClick={addGuest}
                  className='font-mono text-label uppercase tracking-[0.15em] text-gold hover:text-navy transition-colors'
                >
                  + Add Guest
                </button>
              )}
            </div>

            {guests.length === 0 && (
              <p className='font-mono text-label text-navy/30 tracking-[0.1em]'>
                Solo session — tap + Add Guest to register a playing partner.
              </p>
            )}

            <div className='space-y-5'>
              {guests.map((guest, i) => (
                <div
                  key={i}
                  className='relative border border-cream-mid px-4 pt-4 pb-3'
                >
                  <span className='absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/30' />
                  <span className='absolute top-0 right-0 w-3 h-3 border-t border-r border-gold/30' />
                  <div className='flex items-center justify-between mb-3'>
                    <p className='font-mono text-label uppercase tracking-[0.2em] text-sage'>
                      Guest {i + 1}
                    </p>
                    <button
                      onClick={() => removeGuest(i)}
                      className='font-mono text-label uppercase tracking-[0.15em] text-navy/30 hover:text-red-400 transition-colors'
                    >
                      Remove
                    </button>
                  </div>
                  <div className='flex flex-col gap-3'>
                    <Input
                      label='Name'
                      type='text'
                      value={guest.name}
                      onChange={(e) => updateGuest(i, 'name', e.target.value)}
                      placeholder='Jane Smith'
                    />
                    <Input
                      label='Email (optional)'
                      type='email'
                      value={guest.email}
                      onChange={(e) => updateGuest(i, 'email', e.target.value)}
                      placeholder='jane@example.com'
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className='font-mono text-label uppercase tracking-[0.15em] text-red-500 mb-4'>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className='flex gap-3'>
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={exceedsClose}
              className='flex-1'
            >
              Confirm Booking
            </Button>
            <Button variant='ghost' onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
