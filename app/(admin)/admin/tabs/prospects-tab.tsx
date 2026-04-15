'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { MembershipRequest } from '@/lib/supabase/types';
import type { GuestLead } from '@/lib/supabase/queries/bookings';
import { useActionState } from '../hooks/use-action-state';
import {
  AdminSection,
  StatusMessage,
  ConfirmButton,
  AdminEmpty,
  StatusPill,
} from '../components/admin-ui';
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
      className='font-mono text-[10px] uppercase tracking-[0.15em] text-navy/60 border border-cream-mid hover:border-navy hover:text-navy px-3 py-1.5 transition-colors whitespace-nowrap'
    >
      {copied ? 'Copied!' : 'Copy Email'}
    </button>
  );
}

// Visual pipeline indicator
function PipelineSteps() {
  const steps = [
    { label: 'Pending', num: '1', desc: 'Submitted form' },
    { label: 'Contacted', num: '2', desc: 'You reached out' },
    { label: 'Invited', num: '3', desc: 'Invite sent' },
    { label: 'Member', num: '4', desc: 'Joined the club' },
  ];
  return (
    <div className='flex items-start gap-2 flex-wrap mb-6'>
      {steps.map((step, i) => (
        <div key={step.label} className='flex items-center gap-2'>
          <div className='flex flex-col items-center'>
            <div className='w-7 h-7 rounded-full bg-navy/10 border border-navy/20 flex items-center justify-center'>
              <span className='font-mono text-[10px] text-navy/60'>{step.num}</span>
            </div>
            <span className='font-mono text-[9px] uppercase tracking-[0.12em] text-navy/50 mt-1'>{step.label}</span>
            <span className='font-sans text-[10px] text-navy/30 text-center max-w-[60px] leading-tight'>{step.desc}</span>
          </div>
          {i < steps.length - 1 && (
            <span className='font-mono text-navy/20 mt-0 pb-6'>→</span>
          )}
        </div>
      ))}
    </div>
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
    <div className='flex flex-col gap-6'>
      <RequestsTab requests={requests} />

      {/* Guest leads */}
      <AdminSection
        icon='👥'
        title='Guest Leads'
        help='These guests were brought by current members. They might be interested in joining — reach out to them!'
      >
        <StatusMessage message={message} />

        {leads.length === 0 ? (
          <AdminEmpty
            text='No guest bookings recorded yet.'
            subtext='Guests added to reservations will appear here as potential prospects.'
          />
        ) : (
          <div className='space-y-3'>
            {leads.map((lead, i) => (
              <div
                key={`${lead.booking_id}-${i}`}
                className='flex items-center justify-between gap-4 bg-white border border-cream-mid px-4 py-3 flex-wrap'
              >
                <div className='min-w-0'>
                  <p className='font-serif text-sm text-navy font-light'>{lead.guest_name}</p>
                  <a
                    href={`mailto:${lead.guest_email}`}
                    className='font-mono text-[10px] text-gold hover:text-navy transition-colors underline underline-offset-2'
                  >
                    {lead.guest_email}
                  </a>
                  <p className='font-mono text-[10px] text-navy/40 mt-0.5'>
                    Brought by {lead.member?.full_name ?? '—'} · {format(new Date(lead.start_time), 'MMM d, yyyy')}
                  </p>
                </div>
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
              </div>
            ))}
          </div>
        )}
      </AdminSection>
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
    <div className='space-y-6'>
      <StatusMessage message={message} />

      {/* Pipeline visual */}
      <PipelineSteps />

      {/* Active requests */}
      <AdminSection
        icon='📬'
        title={`Membership Requests (${active.length})`}
        help="People who submitted a membership form from the website. Review them, send invites, or decline."
      >
        {active.length === 0 ? (
          <AdminEmpty
            text='No active membership requests.'
            subtext="When someone submits the membership form, they'll appear here."
          />
        ) : (
          <div className='space-y-4'>
            {active.map((req) => (
              <RequestCard key={req.id} request={req} run={run} isPending={isPending} />
            ))}
          </div>
        )}
      </AdminSection>

      {/* Invited */}
      {invited.length > 0 && (
        <AdminSection icon='✉️' title={`Invite Sent (${invited.length})`}>
          <div className='space-y-2'>
            {invited.map((r) => (
              <div
                key={r.id}
                className='flex items-center justify-between gap-4 px-4 py-3 bg-white border border-cream-mid'
              >
                <div className='min-w-0'>
                  <span className='font-serif text-sm text-navy font-light mr-3'>{r.full_name}</span>
                  <span className='font-mono text-[10px] text-navy/40'>{r.email}</span>
                </div>
                <div className='flex items-center gap-3 flex-shrink-0'>
                  <span className='font-mono text-[10px] text-navy/35'>
                    {format(new Date(r.created_at), 'MMM d, yyyy')}
                  </span>
                  <StatusPill status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </AdminSection>
      )}

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
                  <div className='flex items-center gap-3 flex-shrink-0'>
                    <span className='font-mono text-[10px] text-navy/35'>
                      {format(new Date(r.created_at), 'MMM d, yyyy')}
                    </span>
                    <StatusPill status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-3 mb-0.5'>
            <p className='font-serif text-base text-navy font-light'>
              {request.full_name}
            </p>
            <StatusPill status={request.status} />
          </div>
          <p className='font-mono text-xs text-navy/55'>{request.email}</p>
          {request.phone && (
            <p className='font-mono text-xs text-navy/55'>{request.phone}</p>
          )}
          <p className='font-mono text-[10px] text-navy/35 mt-0.5'>
            {format(new Date(request.created_at), 'MMM d, yyyy')}
            {request.referral_source && (
              <span className='ml-2'>· via {request.referral_source}</span>
            )}
          </p>
          {request.message && (
            <blockquote className='mt-3 pl-3 border-l-2 border-gold/40'>
              <p className='font-serif text-sm text-navy/65 italic leading-relaxed'>
                &quot;{request.message}&quot;
              </p>
            </blockquote>
          )}
        </div>
        <div className='flex gap-3 sm:flex-shrink-0 flex-wrap items-start'>
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
          <ConfirmButton
            disabled={isPending}
            onConfirm={() => run(() => inviteFromRequestAction(request.id, request.email))}
            label='Send Invite'
            confirmLabel='Yes, Send Invite'
            confirmMessage={`Send an invitation to ${request.email}?`}
            variant='primary'
          />
          <ConfirmButton
            disabled={isPending}
            onConfirm={() => run(() => declineRequestAction(request.id))}
            label='Decline'
            confirmLabel='Yes, Decline'
            confirmMessage={`Decline ${request.full_name}'s request?`}
            variant='danger'
          />
        </div>
      </div>
    </div>
  );
}
