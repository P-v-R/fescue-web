import Link from 'next/link'
import { getTours, getTournaments, getStandings } from '@/lib/sgt/queries'
import { StandingsTable } from '@/components/sgt/standings-table'
import { getMemberNamesBySgtUsername } from '@/lib/supabase/queries/members'
import type { SgtTour, SgtTournament } from '@/lib/sgt/types'

type Props = {
  params: Promise<{ tourId: string }>
}

function statusBadge(status: string) {
  if (status === 'In Progress') return 'text-navy bg-sage/15'
  if (status === 'Completed') return 'text-navy/50 bg-cream'
  return 'text-navy/40 bg-cream'
}

function EventRow({ event, tourId }: { event: SgtTournament; tourId: number }) {
  const start = new Date(event.start_date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const isPlayable = event.status === 'In Progress' || event.status === 'Completed'

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-cream-mid last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-serif text-base font-light text-navy leading-snug">
          {event.name}
        </p>
        <p className="font-mono text-[10px] text-navy/40 mt-0.5 tracking-[0.08em]">
          {event.courseName} · {start}
        </p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 ${statusBadge(event.status)}`}>
          {event.status}
        </span>
        {isPlayable && (
          <Link
            href={`/tournaments/${tourId}/${event.tournamentId}`}
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-navy/40 hover:text-gold transition-colors whitespace-nowrap"
          >
            Leaderboard →
          </Link>
        )}
      </div>
    </div>
  )
}

export default async function TourDetailPage({ params }: Props) {
  const { tourId: tourIdStr } = await params
  const tourId = Number(tourIdStr)

  if (isNaN(tourId)) return null

  const [tours, tournaments, grossStandings, netStandings, memberNames] = await Promise.all([
    getTours().catch(() => [] as SgtTour[]),
    getTournaments(tourId).catch(() => [] as SgtTournament[]),
    getStandings(tourId, 'gross').catch(() => []),
    getStandings(tourId, 'net').catch(() => []),
    getMemberNamesBySgtUsername().catch(() => ({} as Record<string, string>)),
  ])

  const tour = tours.find((t) => t.tourId === tourId)
  const sorted = [...tournaments].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
  )

  return (
    <div className="max-w-3xl space-y-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/35">
        <Link href="/tournaments" className="hover:text-navy transition-colors">
          Tournaments
        </Link>
        <span>/</span>
        <span className="text-navy/60">{tour?.name ?? `Tour ${tourId}`}</span>
      </nav>

      {/* Tour header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-display font-light text-navy leading-tight">
            {tour?.name ?? `Tour ${tourId}`}
          </h1>
          {tour && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40">
              {new Date(tour.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              {' — '}
              {new Date(tour.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          )}
          <div className="w-12 h-px bg-gold mt-4" />
        </div>
        {tour && (
          tour.active === 1 ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-navy bg-sage/15 px-3 py-1 shrink-0 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-navy animate-pulse" />
              Active
            </span>
          ) : (
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-navy/35 bg-cream px-3 py-1 shrink-0 mt-1">
              Past
            </span>
          )
        )}
      </div>

      {/* Standings */}
      <section>
        <div className="bg-white border border-cream-mid">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-cream-mid">
            <span className="text-gold/70 text-sm leading-none">◈</span>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/60">
              Tour Standings
            </p>
          </div>
          <div className="px-6 py-5">
            {grossStandings.length === 0 && netStandings.length === 0 ? (
              <p className="font-serif italic text-sm text-navy/35">
                Standings not yet available.
              </p>
            ) : (
              <StandingsTable gross={grossStandings} net={netStandings} memberNames={memberNames} />
            )}
          </div>
        </div>
      </section>

      {/* Events */}
      <section>
        <div className="bg-white border border-cream-mid">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-cream-mid">
            <span className="text-gold/70 text-sm leading-none">◈</span>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/60">
              Events
            </p>
            <span className="ml-auto font-mono text-[10px] bg-gold/15 text-gold px-2 py-0.5 tracking-[0.1em]">
              {sorted.length}
            </span>
          </div>
          {sorted.length === 0 ? (
            <div className="px-6 py-5">
              <p className="font-serif italic text-sm text-navy/35">No events scheduled.</p>
            </div>
          ) : (
            <div>
              {sorted.map((event) => (
                <EventRow key={event.tournamentId} event={event} tourId={tourId} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
