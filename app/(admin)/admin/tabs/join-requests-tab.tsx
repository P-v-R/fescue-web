'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { JoinRequest } from '@/lib/supabase/types';
import { useActionState } from '../hooks/use-action-state';
import {
  AdminSection,
  StatusMessage,
  ConfirmButton,
  AdminEmpty,
  StatusPill,
} from '../components/admin-ui';
import { approveJoinRequestAction, declineJoinRequestAction } from '../actions';

export function JoinRequestsTab({ joinRequests }: { joinRequests: JoinRequest[] }) {
  const { message, isPending, run } = useActionState();
  const [showArchived, setShowArchived] = useState(false);
  const [copied, setCopied] = useState(false);

  const pending = joinRequests.filter((r) => r.status === 'pending');
  const archived = joinRequests.filter((r) => r.status === 'approved' || r.status === 'declined');

  const appUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join`
    : '/join';

  function handleCopy() {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className='space-y-6'>
      <StatusMessage message={message} />

      {/* Stat card */}
      <div className='flex gap-4'>
        <div className='bg-white border border-cream-mid px-5 py-4 flex items-center gap-4'>
          <span className='text-3xl font-serif text-navy font-light'>{pending.length}</span>
          <div>
            <p className='font-mono text-[10px] uppercase tracking-[0.2em] text-navy/40'>Pending</p>
            <p className='font-mono text-[10px] uppercase tracking-[0.2em] text-navy/30'>
              {pending.length === 1 ? 'request waiting' : 'requests waiting'}
            </p>
          </div>
        </div>
      </div>

      {/* Shareable join link */}
      <AdminSection
        icon='🔗'
        title='Shareable Join Link'
        help="Share this link with people who want to join the club. They fill out a short form and you'll see their request here."
      >
        <p className='font-sans text-sm text-navy/60 mb-4'>
          Share this link with anyone who wants to join. They fill out a short form and you&apos;ll see
          their request appear below.
        </p>
        <div className='flex items-stretch gap-3 max-w-xl'>
          <code className='flex-1 border border-cream-mid bg-cream/30 px-3 py-2.5 font-mono text-xs text-navy/60 truncate'>
            {appUrl}
          </code>
          <button
            type='button'
            onClick={handleCopy}
            className='flex-shrink-0 bg-navy text-cream font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2.5 hover:opacity-90 transition-opacity'
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </AdminSection>

      {/* Pending requests */}
      <AdminSection
        icon='📋'
        title={`Pending Requests (${pending.length})`}
        help='Each person below filled out the join form. Approve to create their account, or Decline to reject them.'
      >
        {pending.length === 0 ? (
          <AdminEmpty
            text='No pending join requests.'
            subtext="When someone submits the join form, they'll appear here."
          />
        ) : (
          <div className='space-y-4'>
            {pending.map((req) => (
              <JoinRequestCard key={req.id} request={req} run={run} isPending={isPending} />
            ))}
          </div>
        )}
      </AdminSection>

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className='flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-navy/40 hover:text-navy transition-colors mb-4'
          >
            <span>{showArchived ? '▾' : '▸'}</span>
            Archived ({archived.length})
          </button>
          {showArchived && (
            <div className='space-y-2'>
              {archived.map((r) => (
                <div
                  key={r.id}
                  className='flex items-center justify-between gap-4 px-4 py-3 bg-white border border-cream-mid'
                >
                  <div className='min-w-0'>
                    <span className='font-serif text-sm text-navy font-light mr-3'>{r.full_name}</span>
                    <span className='font-mono text-[10px] text-navy/40'>{r.email}</span>
                  </div>
                  <StatusPill status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>
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
    <div className='border border-cream-mid bg-cream/20 p-4 sm:p-5'>
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
        <div className='min-w-0 flex-1'>
          <p className='font-serif text-base text-navy font-light'>{request.full_name}</p>
          <p className='font-mono text-xs text-navy/55'>{request.email}</p>
          {request.phone && (
            <p className='font-mono text-xs text-navy/55'>{request.phone}</p>
          )}
          {request.discord && (
            <p className='font-mono text-xs text-navy/40'>Discord: {request.discord}</p>
          )}
          <p className='font-mono text-xs text-navy/35 mt-0.5'>
            Submitted {format(new Date(request.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        <div className='flex gap-3 sm:flex-shrink-0 flex-wrap items-start'>
          <ConfirmButton
            disabled={isPending}
            onConfirm={() => run(() => approveJoinRequestAction(request.id))}
            label='Approve'
            confirmLabel='Yes, Approve'
            confirmMessage='This creates their account and sends a welcome email.'
            variant='primary'
          />
          <ConfirmButton
            disabled={isPending}
            onConfirm={() => run(() => declineJoinRequestAction(request.id))}
            label='Decline'
            confirmLabel='Yes, Decline'
            confirmMessage="Decline this person's request?"
            variant='danger'
          />
        </div>
      </div>
    </div>
  );
}
