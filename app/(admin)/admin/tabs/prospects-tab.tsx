'use client';

import { useState, useTransition } from 'react';
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
  markContactedAction,
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

function ReachOutModal({ request }: { request: MembershipRequest }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacted, setContacted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const trimmed = request.full_name.trim();
  const firstName = trimmed.split(/\s+/)[0] || trimmed;
  const subject = 'Fescue Golf Club — Membership Inquiry';
  const body = `Hey ${firstName},

I'm Sean, the owner and founder of Fescue Golf Club. Thank you for your interest in becoming a member — we'd love to have you.

I'd be happy to set up a time over the next week or two for you to come see the facility and answer any questions you have about the membership. Just let me know what works for you.

Best,
Sean Gilmore
Fescue Golf Club`;

  const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(request.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function handleMarkContacted() {
    setError(null);
    startTransition(async () => {
      const res = await markContactedAction(request.id);
      if (res.error) {
        setError(res.error);
      } else {
        setContacted(true);
        setTimeout(() => setOpen(false), 800);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(null); setContacted(false); setOpen(true); }}
        className='font-mono text-[10px] uppercase tracking-[0.15em] border border-cream-mid text-navy/60 px-3 py-1.5 hover:border-navy hover:text-navy transition-colors whitespace-nowrap'
      >
        Reach Out
      </button>

      {open && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4'
          onClick={() => !isPending && setOpen(false)}
        >
          <div className='absolute inset-0 bg-navy-dark/60 backdrop-blur-[2px]' />

          <div
            className='relative w-full max-w-lg bg-cream border border-cream-mid shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner ticks */}
            <span className='absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/40' />
            <span className='absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/40' />
            <span className='absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/40' />
            <span className='absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/40' />

            {/* Header */}
            <div className='flex items-start justify-between px-7 pt-7 pb-4'>
              <div>
                <p className='font-mono text-[9px] uppercase tracking-[0.28em] text-gold mb-1'>
                  Membership Inquiry
                </p>
                <h2 className='font-serif text-xl font-light text-navy leading-snug'>
                  {request.full_name}
                </h2>
                <p className='font-mono text-[10px] text-navy/40 mt-0.5'>{request.email}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                aria-label='Close'
                className='w-8 h-8 flex items-center justify-center text-navy/30 hover:text-navy transition-colors -mt-1 -mr-1'
              >
                <svg width='12' height='12' viewBox='0 0 12 12' fill='none'>
                  <path d='M1 1l10 10M11 1L1 11' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
                </svg>
              </button>
            </div>

            <div className='w-8 h-px bg-gold mx-7 mb-5' />

            <div className='px-7 pb-7 space-y-4'>
              <p className='font-mono text-[9px] uppercase tracking-[0.2em] text-navy/40'>
                Email Preview
              </p>

              {/* Email preview */}
              <div className='bg-white border border-cream-mid p-4'>
                <p className='font-mono text-[10px] text-navy/40 mb-3 space-y-0.5'>
                  <span className='block'><span className='text-navy/60'>To:</span> {request.email}</span>
                  <span className='block'><span className='text-navy/60'>Subject:</span> {subject}</span>
                </p>
                <p className='font-sans text-sm text-navy/70 leading-relaxed whitespace-pre-line'>
                  {body}
                </p>
              </div>

              {error && (
                <p className='font-mono text-[10px] text-red-600 tracking-[0.1em]'>{error}</p>
              )}
              {contacted && (
                <p className='font-mono text-[10px] text-sage tracking-[0.1em]'>✓ Marked as contacted</p>
              )}

              <div className='flex gap-3 pt-1 flex-wrap'>
                <a
                  href={gmailUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='bg-navy text-cream font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity'
                >
                  Open in Gmail →
                </a>
                <button
                  onClick={handleMarkContacted}
                  disabled={isPending || contacted}
                  className='border border-cream-mid text-navy/60 font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 hover:border-navy/30 hover:text-navy transition-colors disabled:opacity-50'
                >
                  {isPending ? 'Saving…' : contacted ? 'Contacted ✓' : 'Mark as Contacted'}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className='border border-cream-mid text-navy/40 font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 hover:border-navy/30 hover:text-navy transition-colors disabled:opacity-50'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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
          <ReachOutModal request={request} />
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
