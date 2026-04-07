'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Member, Invite } from '@/lib/supabase/types';
import { useActionState } from '../hooks/use-action-state';
import { SectionHeader } from '../components/section-header';
import { Table } from '../components/table';
import {
  sendInviteAction,
  resendInviteAction,
  rescindInviteAction,
  deactivateMemberAction,
} from '../actions';

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
                  <ResendButton inviteId={inv.id} run={run} isPending={isPending} />
                  <RescindButton inviteId={inv.id} email={inv.email} run={run} isPending={isPending} />
                </div>,
              ],
            }))}
          />
        </section>
      )}

      <MemberLookup members={members} />

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

function MemberLookup({ members }: { members: Member[] }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return members.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query, members]);

  return (
    <section>
      <SectionHeader
        label='Lookup'
        title='Member Search'
        description='Search by name or email to open a member profile.'
      />
      <div className='max-w-md'>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Name or email…'
          className='w-full border-b border-cream-mid bg-transparent pb-2 font-mono text-label text-navy placeholder:text-sand focus:outline-none focus:border-navy'
        />
        {results.length > 0 && (
          <div className='mt-2 border border-cream-mid divide-y divide-cream-mid'>
            {results.map((m) => (
              <Link
                key={m.id}
                href={`/admin/members/${m.id}`}
                className='flex items-baseline justify-between px-4 py-2.5 hover:bg-cream transition-colors group'
              >
                <span className='font-serif text-sm font-light text-navy group-hover:text-navy-dark'>
                  {m.full_name}
                </span>
                <span className='font-mono text-label text-navy/40 group-hover:text-navy/60 transition-colors'>
                  {m.email}
                </span>
              </Link>
            ))}
          </div>
        )}
        {query.trim() && results.length === 0 && (
          <p className='mt-3 font-mono text-label text-navy/30'>No members found.</p>
        )}
      </div>
    </section>
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
