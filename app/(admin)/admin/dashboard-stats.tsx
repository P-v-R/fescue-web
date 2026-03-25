import Link from 'next/link'
import { format } from 'date-fns'
import type { AdminBooking } from '@/lib/supabase/queries/bookings'
import type { Bay } from '@/lib/supabase/types'
import { BayTimeline } from './bay-timeline'

const SLOT_START_HOUR = 8

type Props = {
  activeMembers: number
  bookingsThisWeek: number
  todaysBookings: AdminBooking[]
  bays: Bay[]
  pendingRequests: number
}

export function DashboardStats({ activeMembers, bookingsThisWeek, todaysBookings, bays, pendingRequests }: Props) {
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowSlotIndex = Math.floor((nowMinutes - SLOT_START_HOUR * 60) / 30)

  return (
    <div className="mb-10 flex flex-col gap-6">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Active Members" value={activeMembers}>
          <Link href="/admin/members" className="font-mono text-label text-gold/70 hover:text-gold transition-colors uppercase tracking-[0.15em]">
            View all →
          </Link>
        </StatCard>
        <StatCard label="Bookings This Week" value={bookingsThisWeek} />
        <StatCard label="Pending Requests" value={pendingRequests}>
          {pendingRequests > 0 && (
            <span className="font-mono text-label text-sand/70 uppercase tracking-[0.15em]">needs review</span>
          )}
        </StatCard>
      </div>

      {/* Today's bay timeline */}
      <div className="bg-white border border-cream-mid p-5">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-4">
          Today — {format(now, 'EEEE, MMMM d')}
        </p>
        {todaysBookings.length === 0 ? (
          <p className="font-serif italic text-label text-sand">No bookings today.</p>
        ) : (
          <BayTimeline bays={bays} todaysBookings={todaysBookings} nowSlotIndex={nowSlotIndex} />
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, children }: { label: string; value: number; children?: React.ReactNode }) {
  return (
    <div className="bg-white border border-cream-mid px-5 py-4 flex flex-col gap-1">
      <p className="font-mono text-label uppercase tracking-[0.18em] text-sand">{label}</p>
      <p className="font-serif text-3xl font-light text-navy">{value}</p>
      {children}
    </div>
  )
}
