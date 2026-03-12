'use client';

import { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { format, startOfDay } from 'date-fns';
import type { Member, Invite, MembershipRequest } from '@/lib/supabase/types';
import type { AdminBooking, GuestLead } from '@/lib/supabase/queries/bookings';
import type { BlackoutPeriod } from '@/lib/supabase/queries/blackout-periods';
import type { Bay } from '@/lib/supabase/types';
import {
  sendInviteAction,
  resendInviteAction,
  rescindInviteAction,
  deactivateMemberAction,
  cancelBookingAdminAction,
  getBookingsForDateAction,
  inviteFromRequestAction,
  declineRequestAction,
  createBlackoutAction,
  deleteBlackoutAction,
} from './actions';

type Tab = 'invites' | 'requests' | 'reservations' | 'guests' | 'blackout';

type Props = {
  members: Member[];
  pendingInvites: Invite[];
  requests: MembershipRequest[];
  todaysBookings: AdminBooking[];
  guestLeads: GuestLead[];
  blackoutPeriods: BlackoutPeriod[];
  bays: Bay[];
};

// ─── Status toast ─────────────────────────────────────────────────────────────

function useActionState() {
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string; success?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) setMessage({ text: result.error, isError: true });
      else if (result.success)
        setMessage({ text: result.success, isError: false });
      setTimeout(() => setMessage(null), 4000);
    });
  }

  return { message, isPending, run };
}

// ─── Root component ───────────────────────────────────────────────────────────

export function AdminClient({
  members,
  pendingInvites,
  requests,
  todaysBookings,
  guestLeads,
  blackoutPeriods,
  bays,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('invites');

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'invites', label: 'Members & Invites' },
    {
      id: 'requests',
      label: 'Membership Requests',
      badge: requests.filter((r) => r.status === 'pending').length || undefined,
    },
    { id: 'reservations', label: 'Reservations' },
    {
      id: 'guests',
      label: 'Guest Leads',
      badge: guestLeads.length || undefined,
    },
    { id: 'blackout', label: 'Blackout Dates' },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className='flex gap-0 border-b border-cream-mid mb-8 overflow-x-auto'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex items-center gap-2 px-5 py-3 font-mono text-label uppercase tracking-[0.2em] whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-gold text-navy'
                : 'border-transparent text-navy/45 hover:text-navy',
            ].join(' ')}
          >
            {tab.label}
            {tab.badge && (
              <span className='flex h-4 w-4 items-center justify-center rounded-full bg-gold text-label font-bold text-white'>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panels */}
      {activeTab === 'invites' && (
        <InvitesTab members={members} pendingInvites={pendingInvites} />
      )}
      {activeTab === 'requests' && <RequestsTab requests={requests} />}
      {activeTab === 'reservations' && (
        <ReservationsTab initialBookings={todaysBookings} />
      )}
      {activeTab === 'guests' && <GuestLeadsTab leads={guestLeads} />}
      {activeTab === 'blackout' && (
        <BlackoutDatesTab blackoutPeriods={blackoutPeriods} bays={bays} />
      )}
    </div>
  );
}

// ─── Tab 1: Invites + Members ─────────────────────────────────────────────────

function InvitesTab({
  members,
  pendingInvites,
}: {
  members: Member[];
  pendingInvites: Invite[];
}) {
  const { message, isPending, run } = useActionState();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  const activeMembers = members.filter((m) => m.is_active && !m.is_admin);
  const adminMembers = members.filter((m) => m.is_admin);

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set('email', inviteEmail);
    fd.set('name', inviteName);
    run(async () => {
      const result = await sendInviteAction(fd);
      if (!result.error) {
        setInviteEmail('');
        setInviteName('');
      }
      return result;
    });
  }

  return (
    <div className='space-y-10'>
      {/* Status toast */}
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

      {/* Send invite form */}
      <section>
        <SectionHeader
          label='Invite'
          title='Invite a New Member'
          description='Enter their first name and email to send a personalised invitation.'
        />
        <form
          onSubmit={handleSendInvite}
          className='flex flex-col sm:flex-row gap-3 max-w-xl'
        >
          <input
            type='text'
            name='name'
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder='First name'
            className='w-full sm:w-36 border-b border-cream-mid bg-transparent pb-2 font-mono text-label text-navy placeholder:text-sand focus:outline-none focus:border-navy'
          />
          <input
            type='email'
            name='email'
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder='member@example.com'
            required
            className='flex-1 border-b border-cream-mid bg-transparent pb-2 font-mono text-label text-navy placeholder:text-sand focus:outline-none focus:border-navy'
          />
          <button
            type='submit'
            disabled={isPending || !inviteEmail}
            className='bg-navy text-cream font-mono text-label uppercase tracking-[0.2em] px-5 py-2 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50'
          >
            {isPending ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
      </section>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <section>
          <SectionHeader label='Pending' title='Pending Invitations' />
          <Table
            headers={['Name', 'Email', 'Sent', 'Expires', '']}
            rows={pendingInvites.map((inv) => ({
              id: inv.id,
              cells: [
                inv.name ?? '—',
                inv.email,
                format(new Date(inv.sent_at), 'MMM d, yyyy'),
                format(new Date(inv.expires_at), 'MMM d, yyyy'),
                <div key={inv.id} className='flex gap-4'>
                  <ResendButton
                    inviteId={inv.id}
                    run={run}
                    isPending={isPending}
                  />
                  <RescindButton
                    inviteId={inv.id}
                    email={inv.email}
                    run={run}
                    isPending={isPending}
                  />
                </div>,
              ],
            }))}
          />
        </section>
      )}

      {/* Active members */}
      <section>
        <div className='mb-5'>
          <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-1'>
            Members
          </p>
          <Link
            href='/admin/members'
            className='font-serif text-xl font-light text-navy hover:text-gold transition-colors'
          >
            Active Members: <em>{activeMembers.length}</em>
          </Link>
        </div>
      </section>

      {/* Admins (informational) */}
      {adminMembers.length > 0 && (
        <section>
          <SectionHeader label='Admin' title='Administrators' />
          <Table
            headers={['Name', 'Email', 'Joined']}
            rows={adminMembers.map((m) => ({
              id: m.id,
              cells: [
                m.full_name,
                m.email,
                format(new Date(m.created_at), 'MMM d, yyyy'),
              ],
            }))}
          />
        </section>
      )}
    </div>
  );
}

function ResendButton({
  inviteId,
  run,
  isPending,
}: {
  inviteId: string;
  run: ReturnType<typeof useActionState>['run'];
  isPending: boolean;
}) {
  return (
    <button
      disabled={isPending}
      onClick={() => run(() => resendInviteAction(inviteId))}
      className='font-mono text-label uppercase tracking-[0.15em] text-gold hover:text-navy transition-colors disabled:opacity-40'
    >
      Resend
    </button>
  );
}

function RescindButton({
  inviteId,
  email,
  run,
  isPending,
}: {
  inviteId: string;
  email: string;
  run: ReturnType<typeof useActionState>['run'];
  isPending: boolean;
}) {
  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            `Rescind invitation for ${email}? They will no longer be able to use this invite link.`,
          )
        )
          return;
        run(() => rescindInviteAction(inviteId));
      }}
      className='font-mono text-label uppercase tracking-[0.15em] text-red-400 hover:text-red-700 transition-colors disabled:opacity-40'
    >
      Rescind
    </button>
  );
}

function DeactivateButton({
  memberId,
  name,
  run,
  isPending,
}: {
  memberId: string;
  name: string;
  run: ReturnType<typeof useActionState>['run'];
  isPending: boolean;
}) {
  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            `Deactivate ${name}? They will be signed out immediately and lose all access.`,
          )
        )
          return;
        run(() => deactivateMemberAction(memberId));
      }}
      className='font-mono text-label uppercase tracking-[0.15em] text-red-400 hover:text-red-700 transition-colors disabled:opacity-40'
    >
      Deactivate
    </button>
  );
}

// ─── Tab 2: Membership Requests ───────────────────────────────────────────────

function RequestsTab({ requests }: { requests: MembershipRequest[] }) {
  const { message, isPending, run } = useActionState();

  const pending = requests.filter((r) => r.status === 'pending');
  const handled = requests.filter((r) => r.status !== 'pending');

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
          label='Requests'
          title='Pending Requests'
          description='People who requested a membership invite from the website.'
        />
        {pending.length === 0 ? (
          <EmptyState text='No pending membership requests.' />
        ) : (
          <div className='space-y-4'>
            {pending.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                run={run}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </section>

      {handled.length > 0 && (
        <section>
          <SectionHeader label='History' title='Handled Requests' />
          <Table
            headers={['Name', 'Email', 'Date', 'Status']}
            rows={handled.map((r) => ({
              id: r.id,
              cells: [
                r.full_name,
                r.email,
                format(new Date(r.created_at), 'MMM d, yyyy'),
                <StatusBadge key={r.id} status={r.status} />,
              ],
            }))}
          />
        </section>
      )}
    </div>
  );
}

function RequestCard({
  request,
  run,
  isPending,
}: {
  request: MembershipRequest;
  run: ReturnType<typeof useActionState>['run'];
  isPending: boolean;
}) {
  return (
    <div className='bg-white border border-cream-mid p-4 sm:p-5'>
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
        <div className='min-w-0'>
          <p className='font-serif text-base text-navy font-light'>
            {request.full_name}
          </p>
          <p className='font-mono text-label text-navy/55 mt-0.5'>
            {request.email}
          </p>
          <p className='font-mono text-label text-navy/40 mt-0.5'>
            {format(new Date(request.created_at), 'MMM d, yyyy')}
          </p>
          {request.message && (
            <p className='font-serif text-sm text-navy/70 mt-3 font-light italic leading-relaxed'>
              "{request.message}"
            </p>
          )}
        </div>
        <div className='flex gap-3 sm:flex-shrink-0'>
          <button
            disabled={isPending}
            onClick={() => {
              if (!confirm(`Send an invitation to ${request.email}?`)) return;
              run(() => inviteFromRequestAction(request.id, request.email));
            }}
            className='flex-1 sm:flex-none bg-navy text-cream font-mono text-label uppercase tracking-[0.15em] px-4 py-2.5 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50'
          >
            Invite
          </button>
          <button
            disabled={isPending}
            onClick={() => {
              if (!confirm(`Decline ${request.full_name}'s request?`)) return;
              run(() => declineRequestAction(request.id));
            }}
            className='flex-1 sm:flex-none border border-cream-mid text-navy/50 font-mono text-label uppercase tracking-[0.15em] px-4 py-2.5 hover:border-navy hover:text-navy transition-colors disabled:opacity-50'
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    invited: 'text-sage',
    declined: 'text-navy/40 line-through',
    pending: 'text-gold',
  };
  return (
    <span
      className={`font-mono text-label uppercase tracking-[0.15em] ${styles[status] ?? ''}`}
    >
      {status}
    </span>
  );
}

// ─── Tab 3: Reservations ──────────────────────────────────────────────────────

function ReservationsTab({
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
    const result = await getBookingsForDateAction(d);
    setIsLoading(false);
    if (result.bookings) setBookings(result.bookings);
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
      {/* Date picker */}
      <div className='flex items-end gap-6 mb-8 flex-wrap'>
        <div>
          <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-2'>
            Date
          </p>
          <input
            type='date'
            value={dateStr}
            max={todayStr}
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
        {/* Time */}
        <div className='flex-shrink-0'>
          <p className='font-mono text-label text-gold uppercase tracking-[0.15em]'>
            {format(start, 'h:mm a')}
          </p>
          <p className='font-mono text-label text-navy/55'>
            – {format(end, 'h:mm a')}
          </p>
        </div>

        {/* Bay */}
        <div className='flex-shrink-0'>
          <p className='font-mono text-label uppercase tracking-[0.15em] text-navy'>
            {booking.bays?.name ?? 'Unknown Bay'}
          </p>
          <p className='font-mono text-label text-navy/55'>
            {booking.duration_minutes} min
          </p>
        </div>

        {/* Member */}
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

// ─── Tab 4: Guest Leads ───────────────────────────────────────────────────────

function GuestLeadsTab({ leads }: { leads: GuestLead[] }) {
  return (
    <div>
      <SectionHeader
        label='Sales'
        title={`Guest Leads (${leads.length})`}
        description='Guests registered by members at the time of booking. Potential membership prospects.'
      />

      {leads.length === 0 ? (
        <EmptyState text='No guest bookings recorded yet.' />
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='border-b border-cream-mid'>
                {['Guest', 'Email', 'Brought by', 'Visit date', ''].map((h) => (
                  <th
                    key={h}
                    className='pb-2 font-mono text-label uppercase tracking-[0.2em] text-navy/40 font-normal pr-6'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr
                  key={`${lead.booking_id}-${i}`}
                  className='border-b border-cream-mid/60 last:border-0 group'
                >
                  <td className='py-3 pr-6 font-serif text-sm text-navy font-light whitespace-nowrap'>
                    {lead.guest_name}
                  </td>
                  <td className='py-3 pr-6'>
                    <a
                      href={`mailto:${lead.guest_email}`}
                      className='font-mono text-label text-gold hover:text-navy transition-colors underline underline-offset-2'
                    >
                      {lead.guest_email}
                    </a>
                  </td>
                  <td className='py-3 pr-6 font-mono text-label text-navy/55 whitespace-nowrap'>
                    {lead.member?.full_name ?? '—'}
                  </td>
                  <td className='py-3 pr-6 font-mono text-label text-navy/55 whitespace-nowrap'>
                    {format(new Date(lead.start_time), 'MMM d, yyyy')}
                  </td>
                  <td className='py-3'>
                    <button
                      onClick={() => {}}
                      className='font-mono text-label uppercase tracking-[0.15em] text-cream bg-navy hover:bg-navy-mid px-3 py-1.5 transition-colors whitespace-nowrap'
                    >
                      Send intro email
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Tab 5: Blackout Periods ──────────────────────────────────────────────────

const TIME_OPTIONS = Array.from({ length: 29 }, (_, i) => {
  const totalMins = 8 * 60 + i * 30;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const label = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return { value, label };
});

function BlackoutDatesTab({
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
          {/* Date */}
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

          {/* Time range */}
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

          {/* Bays */}
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
              <span className='font-mono text-label text-navy/70'>
                All bays
              </span>
            </label>
            {!allBays && (
              <div className='flex flex-wrap gap-3'>
                {bays.map((bay) => (
                  <label
                    key={bay.id}
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <input
                      type='checkbox'
                      checked={selectedBayIds.includes(bay.id)}
                      onChange={() => toggleBay(bay.id)}
                      className='accent-navy'
                    />
                    <span className='font-mono text-label text-navy/70'>
                      {bay.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Reason */}
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

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

// ─── Shared UI components ─────────────────────────────────────────────────────

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className='mb-5'>
      <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-1'>
        {label}
      </p>
      <h2 className='font-serif text-xl font-light text-navy'>{title}</h2>
      {description && (
        <p className='font-mono text-label text-navy/50 mt-1 tracking-[0.1em]'>
          {description}
        </p>
      )}
    </div>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: { id: string; cells: (string | React.ReactNode)[] }[];
}) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-left border-collapse'>
        <thead>
          <tr className='border-b border-cream-mid'>
            {headers.map((h) => (
              <th
                key={h}
                className='pb-2 font-mono text-label uppercase tracking-[0.2em] text-navy/40 font-normal pr-6'
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className='border-b border-cream-mid/60 last:border-0'
            >
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className='py-3 pr-6 font-serif text-sm text-navy font-light'
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className='py-10 text-center border border-cream-mid bg-white'>
      <p className='font-mono text-label uppercase tracking-[0.2em] text-sand'>
        {text}
      </p>
    </div>
  );
}
