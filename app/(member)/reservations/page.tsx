import { createClient } from '@/lib/supabase/server'
import { getActiveBays } from '@/lib/supabase/queries/bays'
import { getBookingsForDate } from '@/lib/supabase/queries/bookings'
import { getUpcomingBlackoutPeriods } from '@/lib/supabase/queries/blackout-periods'
import { ReservationsClient } from './reservations-client'

export const metadata = {
  title: 'Bay Reservations — Fescue',
}

export default async function ReservationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date()
  const [bays, initialBookings, blackoutPeriods, memberRow] = await Promise.all([
    getActiveBays(),
    getBookingsForDate(today),
    getUpcomingBlackoutPeriods(),
    user ? supabase.from('members').select('is_admin').eq('id', user.id).single().then(r => r.data) : null,
  ])

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-1">
          Member Portal
        </p>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy">Bay Reservations</h1>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      <ReservationsClient
        bays={bays}
        initialBookings={initialBookings}
        userId={user?.id ?? ''}
        blackoutPeriods={blackoutPeriods}
        isAdmin={memberRow?.is_admin ?? false}
      />
    </div>
  )
}
