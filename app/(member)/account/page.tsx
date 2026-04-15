import { format, isBefore } from 'date-fns'
import Link from 'next/link'
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

  const initials = member?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('') ?? '?'

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Identity header ── */}
      <div className="bg-navy px-8 py-8 flex items-center gap-6">
        <div className="shrink-0 w-16 h-16 rounded-full border border-gold/50 flex items-center justify-center">
          <span className="font-serif text-xl font-light text-gold tracking-wider">
            {initials}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold/70 mb-1">
            Member Portal
          </p>
          <h1 className="font-serif text-2xl font-light text-cream leading-tight truncate">
            {member?.full_name}
          </h1>
          {member?.created_at && (
            <p className="font-mono text-[10px] tracking-[0.15em] text-cream/40 mt-1">
              Member since {format(new Date(member.created_at), 'MMMM yyyy')}
            </p>
          )}
        </div>
      </div>

      {/* ── Profile (read-only) ── */}
      <AccountCard label="Profile" icon="◈">
        <FieldRow label="Full Name" value={member?.full_name} />
        <FieldRow label="Email" value={member?.email} />
        <div className="pt-3 border-t border-cream-mid mt-1">
          <Link
            href="/forgot-password"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40 hover:text-gold transition-colors"
          >
            Change Password →
          </Link>
        </div>
      </AccountCard>

      {/* ── Contact info (editable) ── */}
      <ContactInfoSection
        phone={member?.phone ?? null}
        discord={member?.discord ?? null}
        sgtUsername={member?.sgt_username ?? null}
      />

      {/* ── Email preferences ── */}
      <EmailPreferencesSection
        emailBookingConfirmation={member?.email_booking_confirmation ?? true}
      />

      {/* ── Upcoming bookings ── */}
      <AccountCard
        label="Upcoming Reservations"
        icon="◷"
        count={upcoming.length > 0 ? upcoming.length : undefined}
      >
        {upcoming.length === 0 ? (
          <p className="font-serif italic text-sm text-navy/35 py-2">
            No upcoming reservations.{' '}
            <Link href="/reservations" className="not-italic text-gold hover:underline">
              Book a bay →
            </Link>
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-cream-mid">
            {upcoming.map((booking) => (
              <BookingRow key={booking.id} booking={booking} showCancel />
            ))}
          </div>
        )}
      </AccountCard>

      {/* ── Past bookings ── */}
      {past.length > 0 && (
        <AccountCard label="Past Reservations" icon="◁" muted>
          <div className="flex flex-col divide-y divide-cream-mid">
            {past.slice(0, 10).map((booking) => (
              <BookingRow key={booking.id} booking={booking} showCancel={false} />
            ))}
          </div>
          {past.length > 10 && (
            <p className="font-mono text-[10px] text-navy/30 uppercase tracking-[0.15em] pt-3 border-t border-cream-mid">
              + {past.length - 10} more
            </p>
          )}
        </AccountCard>
      )}
    </div>
  )
}

// ─── Account card wrapper ──────────────────────────────────────────────────
function AccountCard({
  label,
  icon,
  count,
  muted,
  children,
}: {
  label: string
  icon?: string
  count?: number
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-cream-mid">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-cream-mid">
        {icon && (
          <span className="text-gold/70 text-sm leading-none">{icon}</span>
        )}
        <p className={[
          'font-mono text-[10px] uppercase tracking-[0.28em]',
          muted ? 'text-navy/35' : 'text-navy/60',
        ].join(' ')}>
          {label}
        </p>
        {count !== undefined && (
          <span className="ml-auto font-mono text-[10px] bg-gold/15 text-gold px-2 py-0.5 tracking-[0.1em]">
            {count}
          </span>
        )}
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  )
}

// ─── Read-only field row ───────────────────────────────────────────────────
function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-cream-mid/60 last:border-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy/40 shrink-0">
        {label}
      </p>
      <p className="font-sans text-sm font-light text-navy-dark text-right">
        {value ?? <span className="text-navy/25 italic">Not set</span>}
      </p>
    </div>
  )
}

// ─── Booking row ───────────────────────────────────────────────────────────
function BookingRow({
  booking,
  showCancel,
}: {
  booking: BookingWithBay
  showCancel: boolean
}) {
  const start = new Date(booking.start_time)
  const end = new Date(start.getTime() + booking.duration_minutes * 60000)

  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      {/* Date block */}
      <div className="shrink-0 w-12 text-center border-r border-cream-mid pr-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-navy/40 leading-none">
          {format(start, 'MMM')}
        </p>
        <p className="font-serif text-2xl font-light text-navy leading-tight">
          {format(start, 'd')}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-navy/35 leading-none">
          {format(start, 'EEE')}
        </p>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-serif text-base font-light text-navy">
            {booking.bays?.name ?? 'Bay'}
          </p>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gold/80 bg-gold/10 px-1.5 py-0.5">
            {booking.duration_minutes}min
          </span>
        </div>
        <p className="font-mono text-[10px] tracking-[0.08em] text-navy/45 mt-0.5">
          {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
        </p>
        {booking.guests?.length > 0 && (
          <p className="font-sans text-xs font-light text-navy/40 mt-1">
            {booking.guests.map((g) => g.name).join(', ')}
          </p>
        )}
      </div>

      {showCancel && <CancelBookingButton bookingId={booking.id} />}
    </div>
  )
}
