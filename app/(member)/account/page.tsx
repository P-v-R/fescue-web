import { format, isBefore } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { CancelBookingButton } from './cancel-button'
import { ContactInfoSection, EmailPreferencesSection } from './profile-form'
import type { BookingWithBay } from '@/lib/supabase/types'

export const metadata = {
  title: 'My Account — Fescue',
}

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: member }, { data: bookingsRaw }] = await Promise.all([
    supabase
      .from('members')
      .select('full_name, email, phone, discord, sgt_username, created_at, email_booking_confirmation')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('bookings')
      .select('*, bays(name)')
      .eq('member_id', user!.id)
      .is('cancelled_at', null)
      .order('start_time', { ascending: false }),
  ])

  const bookings = (bookingsRaw ?? []) as BookingWithBay[]
  const now = new Date()

  const upcoming = bookings.filter((b) => !isBefore(new Date(b.start_time), now))
  const past = bookings.filter((b) => isBefore(new Date(b.start_time), now))

  return (
    <div className="max-w-3xl">
      {/* Page header */}
      <div className="mb-10">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-1">
          Member Portal
        </p>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy">My Account</h1>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      {/* Profile */}
      <section className="mb-10 pb-10 border-b border-cream-mid">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">Profile</p>
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-mono text-label uppercase tracking-[0.2em] text-sand mb-0.5">
              Name
            </p>
            <p className="font-serif text-xl font-light text-navy">{member?.full_name}</p>
          </div>
          <div>
            <p className="font-mono text-label uppercase tracking-[0.2em] text-sand mb-0.5">
              Email
            </p>
            <p className="font-sans text-sm font-light text-navy-dark">{member?.email}</p>
          </div>
          <div>
            <p className="font-mono text-label uppercase tracking-[0.2em] text-sand mb-0.5">
              Member Since
            </p>
            <p className="font-sans text-sm font-light text-navy-dark">
              {member?.created_at
                ? format(new Date(member.created_at), 'MMMM yyyy')
                : '—'}
            </p>
          </div>
        </div>
      </section>

      <ContactInfoSection phone={member?.phone ?? null} discord={member?.discord ?? null} sgtUsername={member?.sgt_username ?? null} />

      <EmailPreferencesSection emailBookingConfirmation={member?.email_booking_confirmation ?? true} />

      {/* Upcoming bookings */}
      <section className="mb-10 pb-10 border-b border-cream-mid">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
          Upcoming Reservations
        </p>
        {upcoming.length === 0 ? (
          <p className="font-serif italic text-label text-sand">No upcoming bookings.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                showCancel
              />
            ))}
          </div>
        )}
      </section>

      {/* Past bookings */}
      <section>
        <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
          Past Reservations
        </p>
        {past.length === 0 ? (
          <p className="font-serif italic text-label text-sand">No past bookings.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {past.map((booking) => (
              <BookingRow key={booking.id} booking={booking} showCancel={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function BookingRow({
  booking,
  showCancel,
}: {
  booking: BookingWithBay
  showCancel: boolean
}) {
  const start = new Date(booking.start_time)

  return (
    <div className="flex items-start justify-between gap-4 bg-white border border-cream-mid px-5 py-4">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-serif text-xl font-light text-navy">
            {booking.bays?.name ?? 'Bay'}
          </span>
          <span className="font-mono text-label uppercase tracking-[0.15em] text-navy/40">
            {booking.duration_minutes}min
          </span>
        </div>
        <p className="font-mono text-label tracking-[0.1em] text-navy/55">
          {format(start, 'EEEE, MMMM d')} · {format(start, 'h:mm a')} –{' '}
          {format(
            new Date(start.getTime() + booking.duration_minutes * 60000),
            'h:mm a',
          )}
        </p>
        {booking.guests?.length > 0 && (
          <div className="mt-1 flex flex-col gap-0.5">
            {booking.guests.map((g, i) => (
              <p key={i} className="font-sans text-label font-light text-navy/45">
                Guest {booking.guests.length > 1 ? i + 1 : ''}: {g.name}
              </p>
            ))}
          </div>
        )}
      </div>

      {showCancel && <CancelBookingButton bookingId={booking.id} />}
    </div>
  )
}
