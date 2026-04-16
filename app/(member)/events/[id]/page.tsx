import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getEventById } from '@/lib/supabase/queries/events'
import { getMemberRsvpsForEvents, getRsvpsForEvent } from '@/lib/supabase/queries/event-rsvps'
import { RsvpButton } from './rsvp-button'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const event = await getEventById(id)
  return { title: event ? `${event.title} — Fescue` : 'Event — Fescue' }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const event = await getEventById(id)
  if (!event) notFound()

  const [userRsvps, allRsvps] = await Promise.all([
    getMemberRsvpsForEvents(user.id, [event.id]),
    event.rsvp_enabled ? getRsvpsForEvent(event.id) : Promise.resolve([]),
  ])

  const myRsvp = userRsvps.find((r) => r.event_id === event.id)?.status ?? null
  const goingCount = allRsvps.filter((r) => r.status === 'going').length

  const startDate = new Date(event.starts_at)
  const endDate = event.ends_at ? new Date(event.ends_at) : null

  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const timeStr = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })
  const endTimeStr = endDate?.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className="max-w-2xl space-y-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/35">
        <Link href="/calendar" className="hover:text-navy transition-colors">
          Calendar
        </Link>
        <span>/</span>
        <span className="text-navy/60">{event.title}</span>
      </nav>

      {/* Header */}
      <div>
        {event.image_url && (
          <div className="w-full aspect-[3/1] overflow-hidden mb-6">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy leading-tight">
          {event.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/50">
            {dateStr}
          </p>
          <span className="text-navy/20">·</span>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/50">
            {endTimeStr ? `${timeStr} – ${endTimeStr}` : timeStr}
          </p>
          {event.location && (
            <>
              <span className="text-navy/20">·</span>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/50">
                {event.location}
              </p>
            </>
          )}
        </div>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      {/* Description */}
      {event.description && (
        <p className="font-serif font-light text-navy/80 leading-relaxed">
          {event.description}
        </p>
      )}

      {/* RSVP */}
      {event.rsvp_enabled && (
        <div className="bg-white border border-cream-mid p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/60">
              RSVP
            </p>
            {goingCount > 0 && (
              <span className="font-mono text-[10px] bg-gold/15 text-gold px-2 py-0.5 tracking-[0.1em]">
                {goingCount} going
              </span>
            )}
          </div>
          <RsvpButton eventId={event.id} currentStatus={myRsvp} />
        </div>
      )}
    </div>
  )
}
