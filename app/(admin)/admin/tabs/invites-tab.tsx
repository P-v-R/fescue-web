'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format, differenceInDays, isPast } from 'date-fns';
import type { Member, Invite } from '@/lib/supabase/types';
import { useActionState } from '../hooks/use-action-state';
import {
  sendInviteAction,
  resendInviteAction,
  rescindInviteAction,
} from '../actions';
import { Tooltip, StatCard, AdminSection, StatusMessage } from '../components/admin-ui';

// ─── Main tab ─────────────────────────────────────────────────────────────────
export function InvitesTab({
  members,
  pendingInvites,
}: {
  members: Member[];
  pendingInvites: Invite[];
}) {
  const { message, isPending, run } = useActionState();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  const activeMembers = members.filter((m) => m.is_active);
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
    <div className='space-y-6 max-w-3xl'>

      {/* ── Status message ── */}
      <StatusMessage message={message} />

      {/* ── At-a-glance stats ── */}
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
        <StatCard
          value={activeMembers.length}
          label='Active Members'
          sublabel='Currently on the roster'
        />
        <StatCard
          value={pendingInvites.length}
          label='Pending Invites'
          sublabel={pendingInvites.length === 0 ? 'All invites accepted' : 'Awaiting acceptance'}
        />
        <StatCard
          value={adminMembers.length}
          label='Admins'
          sublabel='Full admin access'
        />
      </div>

      {/* ── Find a member ── */}
      <AdminSection
        icon='🔍'
        title='Find a Member'
        help='Search for any member by name or email to view their profile, bookings, and settings.'
      >
        <MemberSearch members={members} />
      </AdminSection>

      {/* ── Invite new member ── */}
      <AdminSection
        icon='✉️'
        title='Invite a New Member'
        help='This sends a private email invitation. The person will set their own password when they accept.'
      >
        <p className='font-sans text-sm text-navy/50 font-light mb-4'>
          Enter the new member&apos;s name and email address. They&apos;ll receive an email with a link to create their account.
        </p>
        <form onSubmit={handleSendInvite} className='flex flex-col sm:flex-row gap-3'>
          <div className='flex flex-col gap-1'>
            <label className='font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40'>
              First Name
            </label>
            <input
              type='text'
              name='name'
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder='e.g. James'
              className='w-full sm:w-36 border border-cream-mid bg-white px-3 py-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors'
            />
          </div>
          <div className='flex flex-col gap-1 flex-1'>
            <label className='font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40'>
              Email Address <span className='text-gold'>*</span>
            </label>
            <input
              type='email'
              name='email'
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder='e.g. james@example.com'
              required
              className='w-full border border-cream-mid bg-white px-3 py-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors'
            />
          </div>
          <div className='flex flex-col gap-1 justify-end'>
            <span className='font-mono text-[10px] uppercase tracking-[0.18em] text-transparent select-none'>
              &nbsp;
            </span>
            <button
              type='submit'
              disabled={isPending || !inviteEmail}
              className='bg-navy text-cream font-mono text-xs uppercase tracking-[0.2em] px-6 py-2 hover:bg-navy-mid transition-colors disabled:opacity-40 whitespace-nowrap'
            >
              {isPending ? 'Sending…' : 'Send Invite →'}
            </button>
          </div>
        </form>
      </AdminSection>

      {/* ── Pending invitations ── */}
      {pendingInvites.length > 0 && (
        <AdminSection
          icon='⏳'
          title={`Pending Invitations (${pendingInvites.length})`}
          help="These people have been invited but haven't created their account yet. You can resend the email or cancel the invite."
        >
          <p className='font-sans text-sm text-navy/50 font-light mb-4'>
            Invitations expire after 7 days. If someone says they didn&apos;t receive their invite, use &quot;Resend Email&quot;.
          </p>
          <div className='flex flex-col gap-2'>
            {pendingInvites.map((inv) => (
              <PendingInviteRow
                key={inv.id}
                invite={inv}
                run={run}
                isPending={isPending}
              />
            ))}
          </div>
        </AdminSection>
      )}

      {/* ── Admins ── */}
      {adminMembers.length > 0 && (
        <AdminSection
          icon='🛡️'
          title='Club Administrators'
          help='These members have full admin access to this panel. Contact your developer to add or remove admins.'
        >
          <div className='flex flex-col gap-2'>
            {adminMembers.map((m) => (
              <div key={m.id} className='flex items-center justify-between px-4 py-3 bg-cream/40 border border-cream-mid'>
                <div>
                  <p className='font-serif text-sm font-light text-navy'>{m.full_name}</p>
                  <p className='font-mono text-[10px] text-navy/40'>{m.email}</p>
                </div>
                <span className='font-mono text-[10px] uppercase tracking-[0.15em] text-gold bg-gold/10 px-2 py-0.5'>
                  Admin
                </span>
              </div>
            ))}
          </div>
        </AdminSection>
      )}
    </div>
  );
}

// ─── Member search ────────────────────────────────────────────────────────────
function MemberSearch({ members }: { members: Member[] }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter(
        (m) =>
          m.full_name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, members]);

  return (
    <div>
      <div className='relative max-w-md'>
        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-navy/30 text-sm pointer-events-none'>
          🔍
        </span>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Type a name or email address…'
          className='w-full border border-cream-mid bg-white pl-8 pr-4 py-2.5 font-sans text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors'
        />
      </div>

      {results.length > 0 && (
        <div className='mt-2 max-w-md border border-cream-mid divide-y divide-cream-mid'>
          {results.map((m) => (
            <Link
              key={m.id}
              href={`/admin/members/${m.id}`}
              className='flex items-center justify-between px-4 py-3 hover:bg-cream/60 transition-colors group'
            >
              <div>
                <p className='font-serif text-sm font-light text-navy group-hover:text-navy-dark'>
                  {m.full_name}
                </p>
                <p className='font-mono text-[10px] text-navy/40'>{m.email}</p>
              </div>
              <div className='flex items-center gap-2'>
                <span className={[
                  'font-mono text-[9px] uppercase tracking-[0.12em] px-2 py-0.5',
                  m.is_active ? 'text-sage bg-sage/10' : 'text-red-400 bg-red-50',
                ].join(' ')}>
                  {m.is_active ? 'Active' : 'Archived'}
                </span>
                <span className='font-mono text-[10px] text-navy/30 group-hover:text-gold transition-colors'>
                  View Profile →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {query.trim() && results.length === 0 && (
        <p className='mt-3 font-sans text-sm text-navy/40 italic'>
          No members found matching &quot;{query}&quot;.
        </p>
      )}

      <Link
        href='/admin/members'
        className='inline-block mt-4 font-mono text-xs uppercase tracking-[0.18em] text-navy border border-navy/20 hover:bg-navy hover:text-cream px-4 py-2 transition-colors'
      >
        View All Members →
      </Link>
    </div>
  );
}

// ─── Pending invite row ───────────────────────────────────────────────────────
function PendingInviteRow({
  invite,
  run,
  isPending,
}: {
  invite: Invite;
  run: ReturnType<typeof useActionState>['run'];
  isPending: boolean;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const expiresAt = new Date(invite.expires_at);
  const daysLeft = differenceInDays(expiresAt, new Date());
  const isExpired = isPast(expiresAt);

  return (
    <div className='border border-cream-mid bg-white'>
      <div className='flex items-start justify-between gap-4 px-4 py-3'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2 mb-0.5'>
            <p className='font-serif text-sm font-light text-navy truncate'>
              {invite.name ?? invite.email}
            </p>
            {isExpired ? (
              <span className='shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-red-500 bg-red-50 px-1.5 py-0.5'>
                Expired
              </span>
            ) : daysLeft <= 2 ? (
              <span className='shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-gold bg-gold/10 px-1.5 py-0.5'>
                Expires soon
              </span>
            ) : null}
          </div>
          {invite.name && (
            <p className='font-mono text-[10px] text-navy/40'>{invite.email}</p>
          )}
          <p className='font-mono text-[10px] text-navy/30 mt-0.5'>
            Sent {format(new Date(invite.sent_at), 'MMM d, yyyy')}
            {isExpired
              ? ' · Expired'
              : ` · Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
          </p>
        </div>

        {!confirmCancel && (
          <div className='flex items-center gap-3 shrink-0'>
            <Tooltip text='Resend the invitation email — useful if they lost it or it went to spam.'>
              <button
                disabled={isPending}
                onClick={() => run(() => resendInviteAction(invite.id))}
                className='font-mono text-[10px] uppercase tracking-[0.15em] text-navy/50 hover:text-navy border border-cream-mid hover:border-navy/30 px-3 py-1.5 transition-colors disabled:opacity-40'
              >
                Resend Email
              </button>
            </Tooltip>
            <Tooltip text='Cancel this invite so the link no longer works. The person will not be notified.'>
              <button
                disabled={isPending}
                onClick={() => setConfirmCancel(true)}
                className='font-mono text-[10px] uppercase tracking-[0.15em] text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-3 py-1.5 transition-colors disabled:opacity-40'
              >
                Cancel Invite
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {confirmCancel && (
        <div className='border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between gap-4'>
          <p className='font-sans text-xs text-red-700'>
            Cancel invite for <strong>{invite.email}</strong>? Their link will stop working.
          </p>
          <div className='flex gap-2 shrink-0'>
            <button
              onClick={() => run(() => rescindInviteAction(invite.id))}
              disabled={isPending}
              className='font-mono text-[10px] uppercase tracking-[0.15em] text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 transition-colors disabled:opacity-40'
            >
              {isPending ? 'Cancelling…' : 'Yes, Cancel'}
            </button>
            <button
              onClick={() => setConfirmCancel(false)}
              className='font-mono text-[10px] uppercase tracking-[0.15em] text-navy/50 hover:text-navy px-3 py-1.5 transition-colors'
            >
              Keep It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DeactivateButton({
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
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className='flex items-center gap-2'>
        <span className='font-mono text-[10px] text-red-600'>Are you sure?</span>
        <button
          disabled={isPending}
          onClick={() => run(() => { setConfirming(false); return Promise.resolve({}); })}
          className='font-mono text-[10px] uppercase tracking-[0.12em] text-navy/50 hover:text-navy transition-colors'
        >
          No
        </button>
        <button
          disabled={isPending}
          onClick={() => run(async () => {
            const { deactivateMemberAction } = await import('../actions');
            return deactivateMemberAction(memberId);
          })}
          className='font-mono text-[10px] uppercase tracking-[0.12em] text-red-500 hover:text-red-700 transition-colors disabled:opacity-40'
        >
          Yes, Deactivate
        </button>
      </div>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={() => setConfirming(true)}
      className='font-mono text-label uppercase tracking-[0.15em] text-red-400 hover:text-red-700 transition-colors disabled:opacity-40'
    >
      Deactivate
    </button>
  );
}
