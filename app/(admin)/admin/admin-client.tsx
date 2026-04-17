'use client';

import { useState } from 'react';
import type { Member, Invite, MembershipRequest, JoinRequest, Event, EventRsvpWithMember } from '@/lib/supabase/types';
import type { AdminBooking, GuestLead } from '@/lib/supabase/queries/bookings';
import type { BlackoutPeriod } from '@/lib/supabase/queries/blackout-periods';
import type { Bay } from '@/lib/supabase/types';
import { InvitesTab } from './tabs/invites-tab';
import { JoinRequestsTab } from './tabs/join-requests-tab';
import { ProspectsTab } from './tabs/prospects-tab';
import { ReservationsTab } from './tabs/reservations-tab';
import { BlackoutDatesTab } from './tabs/blackout-tab';
import { EventsTab } from './tabs/events-tab';

type Tab = 'invites' | 'join-requests' | 'prospects' | 'reservations' | 'blackout' | 'events';

type Props = {
  members: Member[];
  pendingInvites: Invite[];
  requests: MembershipRequest[];
  joinRequests: JoinRequest[];
  todaysBookings: AdminBooking[];
  guestLeads: GuestLead[];
  blackoutPeriods: BlackoutPeriod[];
  bays: Bay[];
  events: Event[];
  eventRsvps: EventRsvpWithMember[];
  discordEnabled: boolean;
};

export function AdminClient({
  members,
  pendingInvites,
  requests,
  joinRequests,
  todaysBookings,
  guestLeads,
  blackoutPeriods,
  bays,
  events,
  eventRsvps,
  discordEnabled,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('invites');

  const pendingJoinRequests = joinRequests.filter((r) => r.status === 'pending').length;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'invites', label: 'Members & Invites' },
    {
      id: 'join-requests',
      label: 'Join Requests',
      badge: pendingJoinRequests || undefined,
    },
    {
      id: 'prospects',
      label: 'Prospects',
      badge:
        requests.filter(
          (r) => r.status === 'pending' || r.status === 'contacted',
        ).length || undefined,
    },
    { id: 'reservations', label: 'Reservations' },
    { id: 'blackout', label: 'Blackout Dates' },
    { id: 'events', label: 'Events' },
  ];

  return (
    <div>
      <div className='flex gap-0 border-b border-cream-mid mb-8 flex-wrap'>
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
              <span className='flex min-w-[1.25rem] h-5 px-1 items-center justify-center bg-gold text-[9px] font-mono font-bold text-white'>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'invites' && (
        <InvitesTab members={members} pendingInvites={pendingInvites} />
      )}
      {activeTab === 'join-requests' && (
        <JoinRequestsTab joinRequests={joinRequests} />
      )}
      {activeTab === 'prospects' && (
        <ProspectsTab requests={requests} leads={guestLeads} />
      )}
      {activeTab === 'reservations' && (
        <ReservationsTab initialBookings={todaysBookings} />
      )}
      {activeTab === 'blackout' && (
        <BlackoutDatesTab blackoutPeriods={blackoutPeriods} bays={bays} />
      )}
      {activeTab === 'events' && (
        <EventsTab events={events} eventRsvps={eventRsvps} discordEnabled={discordEnabled} />
      )}
    </div>
  );
}
