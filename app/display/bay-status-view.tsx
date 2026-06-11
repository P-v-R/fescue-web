import type { Bay, BookingWithMember } from '@/lib/supabase/types'

type Props = {
  bays: Bay[]
  bookings: BookingWithMember[]
}

function firstName(fullName: string | null | undefined): string {
  if (!fullName) return ''
  return fullName.split(' ')[0]
}

function getBayStatus(bay: Bay, bookings: BookingWithMember[], now: Date) {
  const bayBookings = bookings
    .filter((b) => b.bay_id === bay.id)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const current = bayBookings.find(
    (b) => new Date(b.start_time) <= now && now < new Date(b.end_time),
  )
  const next = bayBookings.find((b) => new Date(b.start_time) > now)

  return { current, next }
}

export function BayStatusView({ bays, bookings }: Props) {
  const now = new Date()
  const activeBays = bays.filter((b) => b.is_active)

  return (
    <div className='flex flex-col h-full px-12 py-10'>
      {/* Header */}
      <div className='flex items-center justify-between mb-10'>
        <p className='font-mono text-xs uppercase tracking-[0.28em] text-gold/70'>
          Bay Status
        </p>
        <p className='font-mono text-xs uppercase tracking-[0.22em] text-cream/30'>
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Bay columns */}
      <div
        className='flex-1 grid gap-6'
        style={{ gridTemplateColumns: `repeat(${activeBays.length}, 1fr)` }}
      >
        {activeBays.map((bay) => {
          const { current, next } = getBayStatus(bay, bookings, now)

          return (
            <div
              key={bay.id}
              className='flex flex-col border border-cream/10 bg-cream/[0.03] px-8 py-8'
            >
              {/* Bay name */}
              <p className='font-mono text-xs uppercase tracking-[0.30em] text-gold mb-8'>
                {bay.name}
              </p>

              {/* Current occupant */}
              <div className='mb-8'>
                <p className='font-mono text-[10px] uppercase tracking-[0.22em] text-cream/35 mb-3'>
                  Now Playing
                </p>
                {current ? (
                  <p className='font-serif text-5xl font-light text-cream leading-none'>
                    {firstName(current.members?.full_name)}
                  </p>
                ) : (
                  <p className='font-serif text-5xl font-light text-cream/15 leading-none italic'>
                    —
                  </p>
                )}
                {current && (
                  <p className='font-mono text-xs text-cream/40 mt-2 tracking-[0.12em]'>
                    until{' '}
                    {new Date(current.end_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className='w-12 h-px bg-cream/10 mb-8' />

              {/* Next up */}
              <div>
                <p className='font-mono text-[10px] uppercase tracking-[0.22em] text-cream/35 mb-3'>
                  Up Next
                </p>
                {next ? (
                  <>
                    <p className='font-serif text-2xl font-light text-cream/60 leading-none'>
                      {firstName(next.members?.full_name)}
                    </p>
                    <p className='font-mono text-xs text-cream/30 mt-2 tracking-[0.12em]'>
                      at{' '}
                      {new Date(next.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </>
                ) : (
                  <p className='font-serif text-2xl font-light text-cream/15 leading-none italic'>
                    —
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer ornament */}
      <div className='flex items-center gap-3 mt-10'>
        <div className='flex-1 h-px bg-cream/10' />
        <div className='w-1.5 h-1.5 bg-gold/40 rotate-45 shrink-0' />
        <div className='flex-1 h-px bg-cream/10' />
      </div>
    </div>
  )
}
