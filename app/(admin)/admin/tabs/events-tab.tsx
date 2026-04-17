'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { Event, EventRsvpWithMember } from '@/lib/supabase/types';
import { EventImageUpload } from '@/components/ui/event-image-upload';
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
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
  removeRsvpAction,
} from '../actions';
import { DiscordNotifyButton } from '../components/discord-notify-button';

const EVENT_TIME_OPTIONS = Array.from({ length: 72 }, (_, i) => {
  const totalMins = 6 * 60 + i * 15;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const label = `${displayH}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return { value, label };
});

export function EventsTab({
  events,
  eventRsvps,
  discordEnabled,
}: {
  events: Event[];
  eventRsvps: EventRsvpWithMember[];
  discordEnabled: boolean;
}) {
  const { message, isPending, run } = useActionState();
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsDate, setStartsDate] = useState('');
  const [startsTime, setStartsTime] = useState('19:00');
  const [endsTime, setEndsTime] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [rsvpEnabled, setRsvpEnabled] = useState(true);

  function resetForm() {
    setTitle(''); setDescription(''); setStartsDate(''); setStartsTime('19:00');
    setEndsTime(''); setLocation(''); setImageUrl(''); setRsvpEnabled(true);
    setEditingEvent(null);
  }

  function startEdit(event: Event) {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description ?? '');

    const startsLocal = new Date(event.starts_at);
    setStartsDate(startsLocal.toLocaleDateString('en-CA'));
    setStartsTime(
      `${String(startsLocal.getHours()).padStart(2, '0')}:${String(startsLocal.getMinutes()).padStart(2, '0')}`,
    );

    if (event.ends_at) {
      const endsLocal = new Date(event.ends_at);
      setEndsTime(
        `${String(endsLocal.getHours()).padStart(2, '0')}:${String(endsLocal.getMinutes()).padStart(2, '0')}`,
      );
    } else {
      setEndsTime('');
    }

    setLocation(event.location ?? '');
    setImageUrl(event.image_url ?? '');
    setRsvpEnabled(event.rsvp_enabled);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set('title', title);
    fd.set('description', description);
    fd.set('starts_at', `${startsDate}T${startsTime}`);
    fd.set('ends_at', endsTime);
    fd.set('location', location);
    fd.set('image_url', imageUrl);
    fd.set('rsvp_enabled', String(rsvpEnabled));
    run(async () => {
      const result = editingEvent
        ? await updateEventAction(editingEvent.id, fd)
        : await createEventAction(fd);
      if (!result.error) resetForm();
      return result;
    });
  }

  const rsvpsByEvent = useMemo(() => {
    const map: Record<string, EventRsvpWithMember[]> = {};
    for (const rsvp of eventRsvps) {
      if (!map[rsvp.event_id]) map[rsvp.event_id] = [];
      map[rsvp.event_id].push(rsvp);
    }
    return map;
  }, [eventRsvps]);

  return (
    <div className='space-y-6'>
      <StatusMessage message={message} />

      {/* Create / Edit form */}
      <AdminSection
        icon='✏️'
        title={editingEvent ? `Edit: ${editingEvent.title}` : 'Create New Event'}
        help='Events appear on the member calendar. Members can RSVP if you enable it.'
      >
        <form onSubmit={handleSubmit} className='space-y-5 max-w-lg'>
          {/* Title */}
          <div>
            <FieldLabel required>Title</FieldLabel>
            <input
              type='text'
              value={title}
              required
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Summer Member Night'
              className={inputCls}
            />
          </div>

          {/* Date + Start time */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <FieldLabel required>Date</FieldLabel>
              <input
                type='date'
                value={startsDate}
                required
                onChange={(e) => setStartsDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel required>Start time</FieldLabel>
              <select
                value={startsTime}
                required
                onChange={(e) => setStartsTime(e.target.value)}
                className={selectCls + ' w-full'}
              >
                {EVENT_TIME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* End time */}
          <div className='max-w-[calc(50%-8px)]'>
            <FieldLabel>
              End time <span className='normal-case font-sans text-[10px] text-navy/30'>(optional)</span>
            </FieldLabel>
            <select
              value={endsTime}
              onChange={(e) => setEndsTime(e.target.value)}
              className={selectCls + ' w-full'}
            >
              <option value=''>— none —</option>
              {EVENT_TIME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <FieldLabel>
              Location <span className='normal-case font-sans text-[10px] text-navy/30'>(optional)</span>
            </FieldLabel>
            <input
              type='text'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='The Simulator Room'
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <FieldLabel>
              Description <span className='normal-case font-sans text-[10px] text-navy/30'>(optional)</span>
            </FieldLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder='Event details…'
              className={inputCls + ' resize-none'}
            />
          </div>

          {/* Photo */}
          <div>
            <FieldLabel>
              Photo <span className='normal-case font-sans text-[10px] text-navy/30'>(optional)</span>
            </FieldLabel>
            <EventImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          {/* RSVP toggle */}
          <label className='flex items-center gap-2.5 cursor-pointer'>
            <input
              type='checkbox'
              checked={rsvpEnabled}
              onChange={(e) => setRsvpEnabled(e.target.checked)}
              className='accent-navy w-4 h-4'
            />
            <span className='font-sans text-sm text-navy'>Allow members to RSVP to this event</span>
          </label>

          <div className='flex gap-3'>
            <button
              type='submit'
              disabled={isPending || !title || !startsDate}
              className='bg-navy text-cream font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50'
            >
              {isPending ? 'Saving…' : editingEvent ? 'Save Changes →' : 'Create Event →'}
            </button>
            {editingEvent && (
              <button
                type='button'
                onClick={resetForm}
                className='border border-cream-mid text-navy/50 font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 hover:border-navy/30 hover:text-navy transition-colors'
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </AdminSection>

      {/* Events list */}
      <AdminSection
        icon='📅'
        title={`Upcoming Events (${events.length})`}
      >
        {events.length === 0 ? (
          <AdminEmpty text='No events yet. Create one above.' />
        ) : (
          <div className='space-y-3'>
            {events.map((event) => {
              const rsvps = rsvpsByEvent[event.id] ?? [];
              const goingCount = rsvps.filter((r) => r.status === 'going').length;
              const isExpanded = expandedEventId === event.id;

              return (
                <div key={event.id} className='border border-cream-mid bg-white'>
                  <div className='px-4 sm:px-5 py-4 flex items-start gap-4 sm:gap-6'>
                    {/* Date/time */}
                    <div className='flex-shrink-0 w-20'>
                      <p className='font-mono text-xs text-gold uppercase tracking-[0.12em]'>
                        {format(new Date(event.starts_at), 'MMM d')}
                      </p>
                      <p className='font-mono text-xs text-navy/50'>
                        {format(new Date(event.starts_at), 'h:mm a')}
                      </p>
                    </div>

                    {/* Details */}
                    <div className='min-w-0 flex-1'>
                      <p className='font-serif text-sm text-navy font-light'>{event.title}</p>
                      {event.location && (
                        <p className='font-mono text-[10px] text-navy/40 truncate mt-0.5'>{event.location}</p>
                      )}
                      {event.rsvp_enabled && (
                        <div className='flex items-center gap-2 mt-1'>
                          <span className='font-mono text-[10px] uppercase tracking-[0.12em] text-cream bg-sage/70 px-2 py-0.5'>
                            {goingCount} going
                          </span>
                          <button
                            onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                            className='font-mono text-[10px] uppercase tracking-[0.12em] text-sage hover:text-navy transition-colors'
                          >
                            {isExpanded ? 'Hide ▴' : 'View RSVPs ▾'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className='flex gap-3 flex-shrink-0 items-center'>
                      <button
                        onClick={() => startEdit(event)}
                        className='font-mono text-[10px] uppercase tracking-[0.15em] text-gold hover:text-navy transition-colors'
                      >
                        Edit
                      </button>
                      {discordEnabled && <DiscordNotifyButton event={event} />}
                      <ConfirmButton
                        disabled={isPending}
                        onConfirm={() => run(() => deleteEventAction(event.id))}
                        label='Delete'
                        confirmLabel='Yes, Delete'
                        confirmMessage='Delete this event and all RSVPs?'
                        variant='danger'
                      />
                    </div>
                  </div>

                  {/* RSVPs expanded */}
                  {isExpanded && rsvps.length > 0 && (
                    <div className='border-t border-cream-mid px-4 sm:px-5 py-3'>
                      <p className='font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40 mb-3'>
                        RSVPs
                      </p>
                      <div className='space-y-2'>
                        {rsvps.map((rsvp) => (
                          <div key={rsvp.id} className='flex items-center justify-between gap-4'>
                            <div className='flex items-center gap-3'>
                              <span className='font-serif text-sm font-light text-navy'>
                                {rsvp.members?.full_name ?? 'Unknown'}
                              </span>
                              <span className={[
                                'font-mono text-[10px] uppercase tracking-[0.12em]',
                                rsvp.status === 'going' ? 'text-sage' : 'text-navy/35',
                              ].join(' ')}>
                                {rsvp.status === 'going' ? 'Going' : 'Not going'}
                              </span>
                            </div>
                            <ConfirmButton
                              disabled={isPending}
                              onConfirm={() => run(() => removeRsvpAction(event.id, rsvp.member_id))}
                              label='Remove'
                              confirmLabel='Yes, Remove'
                              confirmMessage="Remove this person's RSVP?"
                              variant='danger'
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isExpanded && rsvps.length === 0 && (
                    <div className='border-t border-cream-mid px-4 sm:px-5 py-3'>
                      <p className='font-mono text-[10px] text-navy/30 uppercase tracking-[0.15em]'>No RSVPs yet.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
