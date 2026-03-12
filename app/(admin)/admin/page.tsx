import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllMembers } from '@/lib/supabase/queries/members'
import { getPendingInvites } from '@/lib/supabase/queries/invites'
import { getMembershipRequests } from '@/lib/supabase/queries/membership-requests'
import { getAdminBookingsForToday, getGuestLeads } from '@/lib/supabase/queries/bookings'
import { getBlackoutPeriods } from '@/lib/supabase/queries/blackout-periods'
import { getActiveBays } from '@/lib/supabase/queries/bays'
import { AdminClient } from './admin-client'

export const metadata = {
  title: 'Admin — Fescue',
}

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // Server-side admin guard (middleware also protects this route)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!member?.is_admin) redirect('/dashboard')

  // Parallel data fetch
  const [members, pendingInvites, requests, todaysBookings, guestLeads, blackoutPeriods, bays] = await Promise.all([
    getAllMembers(),
    getPendingInvites(),
    getMembershipRequests(),
    getAdminBookingsForToday(),
    getGuestLeads(),
    getBlackoutPeriods(),
    getActiveBays(),
  ])

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-1">
          Admin Panel
        </p>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy">Club Management</h1>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      <AdminClient
        members={members}
        pendingInvites={pendingInvites}
        requests={requests}
        todaysBookings={todaysBookings}
        guestLeads={guestLeads}
        blackoutPeriods={blackoutPeriods}
        bays={bays}
      />
    </div>
  )
}
