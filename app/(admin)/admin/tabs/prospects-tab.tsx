'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { MembershipRequest } from '@/lib/supabase/types';
import type { GuestLead } from '@/lib/supabase/queries/bookings';
import { useActionState } from '../hooks/use-action-state';
import { SectionHeader } from '../components/section-header';
import { Table } from '../components/table';
import { EmptyState } from '../components/empty-state';
import { StatusBadge } from '../components/status-badge';
import {
  inviteFromRequestAction,
  declineRequestAction,
  // sendIntroEmailAction,
  // sendGuestIntroEmailAction,
  markContactedAction,
  markPendingAction,
} from '../actions';

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className='font-mono text-label uppercase tracking-[0.15em] text-navy/60 border border-cream-mid hover:border-navy hover:text-navy px-3 py-1.5 transition-colors whitespace-nowrap'
    >
      {copied ? 'Copied!' : 'Copy Email'}
    </button>
  );
}

export function ProspectsTab({
  requests,
  leads,
}: {
  requests: MembershipRequest[];
  leads: GuestLead[];
}) {
  const { message, isPending, run } = useActionState();

  return (
    <div className='flex flex-col gap-14'>
      <RequestsTab requests={requests} />

      <div className='flex items-center gap-4'>
        <div className='flex-1 h-px bg-cream-mid' />
        <span className='font-mono text-label uppercase tracking-[0.2em] text-navy/25'>
          Guest Leads
        </span>
        <div className='flex-1 h-px bg-cream-mid' />
      </div>

      <div>
        <SectionHeader
          label='Via Bookings'
          title='Guest Leads'
          description='Guests registered by members at the time of booking. Potential membership prospects.'
        />

        {message && (
          <div
            className={[
              'mb-4 px-4 py-3 font-mono text-label uppercase tracking-[0.15em]',
              message.isError
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-sage/10 text-sage border border-sage/30',
            ].join(' ')}
          >
            {message.text}
          </div>
        )}

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
                      <CopyEmailButton email={lead.guest_email} />
                      {/* TODO: re-enable intro email flow when ready
                      <button
                        disabled={isPending}
                        onClick={() => {
                          if (!confirm(`Send intro email to ${lead.guest_email}?`)) return;
                          run(() => sendGuestIntroEmailAction(lead.guest_email, lead.guest_name));
                        }}
                        className='font-mono text-label uppercase tracking-[0.15em] text-cream bg-navy hover:bg-navy-mid px-3 py-1.5 transition-colors whitespace-nowrap disabled:opacity-50'
                      >
                        {isPending ? 'Sending…' : 'Send intro email'}
                      </button>
                      */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestsTab({ requests }: { requests: MembershipRequest[] }) {
  const { message, isPending, run } = useActionState();
  const [showArchived, setShowArchived] = useState(false);

  const active = requests.filter(
    (r) => r.status === 'pending' || r.status === 'contacted',
  );
  const invited = requests.filter((r) => r.status === 'invited');
  const archived = requests.filter(
    (r) => r.status === 'declined' || r.status === 'onboarded',
  );

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
          label='Pipeline'
          title={`Active Requests (${active.length})`}
          description="People who requested membership. Mark as contacted once you've reached out."
        />
        {active.length === 0 ? (
          <EmptyState text='No active membership requests.' />
        ) : (
          <div className='space-y-4'>
            {active.map((req) => (
              <RequestCard key={req.id} request={req} run={run} isPending={isPending} />
            ))}
          </div>
        )}
      </section>

      {invited.length > 0 && (
        <section>
          <SectionHeader label='Invited' title={`Invite Sent (${invited.length})`} />
          <Table
            headers={['Name', 'Email', 'Date']}
            rows={invited.map((r) => ({
              id: r.id,
              cells: [
                r.full_name,
                r.email,
                format(new Date(r.created_at), 'MMM d, yyyy'),
              ],
            }))}
          />
        </section>
      )}

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
                headers={['Name', 'Email', 'Date', 'Status']}
                rows={archived.map((r) => ({
                  id: r.id,
                  cells: [
                    r.full_name,
                    r.email,
                    format(new Date(r.created_at), 'MMM d, yyyy'),
                    <StatusBadge key={r.id} status={r.status} />,
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
          <div className='flex items-center gap-3 mb-0.5'>
            <p className='font-serif text-base text-navy font-light'>
              {request.full_name}
            </p>
            {request.status === 'contacted' && (
              <span className='font-mono text-label uppercase tracking-[0.12em] text-gold/80'>
                Contacted
              </span>
            )}
          </div>
          <p className='font-mono text-label text-navy/55'>{request.email}</p>
          {request.phone && (
            <p className='font-mono text-label text-navy/55'>{request.phone}</p>
          )}
          <p className='font-mono text-label text-navy/40 mt-0.5'>
            {format(new Date(request.created_at), 'MMM d, yyyy')}
            {request.referral_source && (
              <span className='ml-2'>· via {request.referral_source}</span>
            )}
          </p>
          {request.message && (
            <p className='font-serif text-sm text-navy/70 mt-3 font-light italic leading-relaxed'>
              &quot;{request.message}&quot;
            </p>
          )}
        </div>
        <div className='flex gap-3 sm:flex-shrink-0 flex-wrap'>
          {/* TODO: re-enable intro email flow when ready
          {request.status === 'pending' ? (
            <button
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Send intro email to ${request.email}?`)) return;
                run(() => sendIntroEmailAction(request.id, request.email, request.full_name));
              }}
              className='flex-1 sm:flex-none border border-cream-mid text-navy/60 font-mono text-label uppercase tracking-[0.15em] px-4 py-2.5 hover:border-navy hover:text-navy transition-colors disabled:opacity-50'
            >
              Send Intro
            </button>
          ) : (
            <button
              disabled={isPending}
              onClick={() => run(() => markPendingAction(request.id))}
              className='flex-1 sm:flex-none border border-cream-mid text-navy/60 font-mono text-label uppercase tracking-[0.15em] px-4 py-2.5 hover:border-alert hover:text-alert transition-colors disabled:opacity-50'
            >
              Remark as Pending
            </button>
          )}
          */}
          <CopyEmailButton email={request.email} />
          <button
            disabled={isPending}
            onClick={() => {
              if (!confirm(`Send an invitation to ${request.email}?`)) return;
              run(() => inviteFromRequestAction(request.id, request.email));
            }}
            className='flex-1 sm:flex-none bg-navy text-cream font-mono text-label uppercase tracking-[0.15em] px-4 py-2.5 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50'
          >
            Send Invite
          </button>
          <button
            disabled={isPending}
            onClick={() => {
              if (!confirm(`Decline ${request.full_name}'s request?`)) return;
              run(() => declineRequestAction(request.id));
            }}
            className='flex-1 sm:flex-none border border-cream-mid text-navy/50 font-mono text-label uppercase tracking-[0.15em] px-4 py-2.5 hover:border-alert hover:text-alert transition-colors disabled:opacity-50'
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
