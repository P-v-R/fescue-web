'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { JoinRequest } from '@/lib/supabase/types';
import { useActionState } from '../hooks/use-action-state';
import { SectionHeader } from '../components/section-header';
import { Table } from '../components/table';
import { EmptyState } from '../components/empty-state';
import { approveJoinRequestAction, declineJoinRequestAction } from '../actions';

export function JoinRequestsTab({ joinRequests }: { joinRequests: JoinRequest[] }) {
  const { message, isPending, run } = useActionState();
  const [showArchived, setShowArchived] = useState(false);

  const pending = joinRequests.filter((r) => r.status === 'pending');
  const archived = joinRequests.filter((r) => r.status === 'approved' || r.status === 'declined');

  const appUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join`
    : '/join';

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
          label='Access Link'
          title='Shareable Join Link'
          description='Send this link to existing club members so they can request an account. Each submission requires admin approval before they can sign in.'
        />
        <div className='flex items-center gap-3 max-w-xl'>
          <code className='flex-1 border border-cream-mid bg-white px-3 py-2 font-mono text-label text-navy/70 truncate'>
            {appUrl}
          </code>
          <button
            type='button'
            onClick={() => navigator.clipboard.writeText(appUrl)}
            className='flex-shrink-0 border border-cream-mid text-navy/60 font-mono text-label uppercase tracking-[0.15em] px-4 py-2 hover:border-navy hover:text-navy transition-colors'
          >
            Copy
          </button>
        </div>
      </section>

      <section>
        <SectionHeader
          label='Pending'
          title={`Pending Requests (${pending.length})`}
          description='Approve to create their account and send a welcome email. Decline to reject the request.'
        />
        {pending.length === 0 ? (
          <EmptyState text='No pending join requests.' />
        ) : (
          <div className='space-y-4'>
            {pending.map((req) => (
              <JoinRequestCard key={req.id} request={req} run={run} isPending={isPending} />
            ))}
          </div>
        )}
      </section>

      {archived.length > 0 && (
        <section>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className='flex items-center gap-2 font-mono text-label uppercase tracking-[0.2em] text-navy/40 hover:text-navy transition-colors'
          >
            <span>{showArchived ? '▾' : '▸'}</span>
            Archived ({archived.length})
          </button>
          {showArchived && (
            <div className='mt-4'>
              <Table
                headers={['Name', 'Email', 'Submitted', 'Status']}
                rows={archived.map((r) => ({
                  id: r.id,
                  cells: [
                    r.full_name,
                    r.email,
                    format(new Date(r.created_at), 'MMM d, yyyy'),
                    <span
                      key={r.id}
                      className={[
                        'font-mono text-label uppercase tracking-[0.15em]',
                        r.status === 'approved' ? 'text-sage' : 'text-navy/40 line-through',
                      ].join(' ')}
                    >
                      {r.status}
                    </span>,
                  ],
                }))}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function JoinRequestCard({
  request,
  run,
  isPending,
}: {
  request: JoinRequest;
  run: ReturnType<typeof useActionState>['run'];
  isPending: boolean;
}) {
  return (
    <div className='bg-white border border-cream-mid p-4 sm:p-5'>
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
        <div className='min-w-0'>
          <p className='font-serif text-base text-navy font-light'>{request.full_name}</p>
          <p className='font-mono text-label text-navy/55'>{request.email}</p>
          {request.phone && (
            <p className='font-mono text-label text-navy/55'>{request.phone}</p>
          )}
          {request.discord && (
            <p className='font-mono text-label text-navy/40'>Discord: {request.discord}</p>
          )}
          <p className='font-mono text-label text-navy/40 mt-0.5'>
            {format(new Date(request.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        <div className='flex gap-3 sm:flex-shrink-0 flex-wrap'>
          <button
            disabled={isPending}
            onClick={() => {
              if (
                !confirm(
                  `Approve ${request.full_name} (${request.email})?\n\nThis will create their account and send a welcome email.`,
                )
              )
                return;
              run(() => approveJoinRequestAction(request.id));
            }}
            className='flex-1 sm:flex-none bg-navy text-cream font-mono text-label uppercase tracking-[0.15em] px-4 py-2.5 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50'
          >
            Approve
          </button>
          <button
            disabled={isPending}
            onClick={() => {
              if (!confirm(`Decline ${request.full_name}'s request?`)) return;
              run(() => declineJoinRequestAction(request.id));
            }}
            className='flex-1 sm:flex-none border border-cream-mid text-navy/50 font-mono text-label uppercase tracking-[0.15em] px-4 py-2.5 hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50'
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
