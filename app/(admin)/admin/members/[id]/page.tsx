import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format, isBefore } from 'date-fns'
import { getMemberById } from '@/lib/supabase/queries/members'
import { getAdminMemberBookings } from '@/lib/supabase/queries/bookings'
import { getActiveBays } from '@/lib/supabase/queries/bays'
import { BookForMemberModal } from './book-for-member-modal'

type Props = {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function MemberProfilePage({ params }: Props) {
  const { id } = await params
  const [member, bookings, bays] = await Promise.all([
    getMemberById(id),
    getAdminMemberBookings(id),
    getActiveBays(),
  ])

  if (!member) notFound()

  const now = new Date()
  const upcoming = bookings.filter((b) => !b.cancelled_at && !isBefore(new Date(b.start_time), now))
  const past = bookings.filter((b) => !b.cancelled_at && isBefore(new Date(b.start_time), now))
  const cancelled = bookings.filter((b) => b.cancelled_at)

  // Flatten all guests across all bookings, deduplicated by email (or name if no email)
  const guestMap = new Map<string, { name: string; email: string; count: number }>()
  bookings.forEach((b) => {
    (b.guests ?? []).forEach((g) => {
      const key = (g.email ?? g.name ?? '').toLowerCase()
      if (!key) return
      const existing = guestMap.get(key)
      if (existing) {
        existing.count++
      } else {
        guestMap.set(key, { ...g, email: g.email ?? '', count: 1 })
      }
    })
  })
  const guests = Array.from(guestMap.values()).sort((a, b) => b.count - a.count)

  return (
    <div className="max-w-3xl">
      {/* Back + header */}
      <div className="mb-8">
        <Link
          href="/admin/members"
          className="font-mono text-label uppercase tracking-[0.18em] text-sand hover:text-gold transition-colors mb-4 inline-block"
        >
          ← Members
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-1">Member Profile</p>
            <h1 className="font-serif text-2xl sm:text-display font-light text-navy">{member.full_name}</h1>
            <div className="w-12 h-px bg-gold mt-4" />
          </div>
          <BookForMemberModal memberId={member.id} memberName={member.full_name} bays={bays} />
        </div>
      </div>

      {/* Contact info */}
      <section className="mb-10 pb-10 border-b border-cream-mid">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">Contact Info</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <InfoField label="Email" value={member.email} />
          <InfoField label="Phone" value={member.phone} />
          <InfoField label="Discord" value={member.discord} />
          <InfoField label="Member Since" value={format(new Date(member.created_at), 'MMMM yyyy')} />
          <InfoField label="Status" value={member.is_active ? (member.is_admin ? 'Admin' : 'Active') : 'Inactive'} />
        </div>
      </section>

      {/* Upcoming bookings */}
      <section className="mb-10 pb-10 border-b border-cream-mid">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
          Upcoming Reservations ({upcoming.length})
        </p>
        {upcoming.length === 0 ? (
          <p className="font-serif italic text-label text-sand">No upcoming bookings.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((b) => <BookingRow key={b.id} booking={b} />)}
          </div>
        )}
      </section>

      {/* Past bookings */}
      <section className="mb-10 pb-10 border-b border-cream-mid">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
          Past Reservations ({past.length})
        </p>
        {past.length === 0 ? (
          <p className="font-serif italic text-label text-sand">No past bookings.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {past.slice(0, 20).map((b) => <BookingRow key={b.id} booking={b} />)}
            {past.length > 20 && (
              <p className="font-mono text-label text-navy/40">{past.length - 20} older bookings not shown.</p>
            )}
          </div>
        )}
      </section>

      {/* Guest history */}
      <section>
        <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
          Guest History ({guests.length} unique)
        </p>
        {guests.length === 0 ? (
          <p className="font-serif italic text-label text-sand">No guests on record.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {guests.map((g) => (
              <div key={g.email} className="bg-white border border-cream-mid px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-serif text-lg font-light text-navy">{g.name}</p>
                  <p className="font-mono text-label text-navy/45">{g.email}</p>
                </div>
                <p className="font-mono text-label text-navy/40">
                  {g.count} {g.count === 1 ? 'visit' : 'visits'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="font-mono text-label uppercase tracking-[0.18em] text-sand mb-0.5">{label}</p>
      <p className="font-sans text-sm font-light text-navy-dark">
        {value ?? <span className="text-navy/30 italic">Not set</span>}
      </p>
    </div>
  )
}

function BookingRow({ booking }: { booking: ReturnType<typeof Array.prototype.filter>[number] }) {
  const start = new Date(booking.start_time)
  return (
    <div className="bg-white border border-cream-mid px-5 py-3 flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <p className="font-serif text-lg font-light text-navy">{booking.bays?.name ?? 'Bay'}</p>
          <span className="font-mono text-label text-navy/40">{booking.duration_minutes}min</span>
        </div>
        <p className="font-mono text-label text-navy/55">
          {format(start, 'EEE, MMM d')} · {format(start, 'h:mm a')} –{' '}
          {format(new Date(start.getTime() + booking.duration_minutes * 60000), 'h:mm a')}
        </p>
      </div>
      {(booking.guests?.length ?? 0) > 0 && (
        <p className="font-mono text-label text-navy/40">
          +{booking.guests.length} guest{booking.guests.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
