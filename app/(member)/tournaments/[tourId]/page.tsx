import Link from 'next/link'
import { getTours, getTournaments, getStandings } from '@/lib/sgt/queries'
import { StandingsTable } from '@/components/sgt/standings-table'
import type { SgtTour, SgtTournament } from '@/lib/sgt/types'

type Props = {
  params: Promise<{ tourId: string }>
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    'In Progress': 'text-[var(--color-navy)] bg-[var(--color-sage-light)]',
    Upcoming: 'text-[var(--color-sage)] bg-[var(--color-sand-light)]',
    Completed: 'text-[var(--color-sand-dark)] bg-[var(--color-sand-light)]',
  }
  return map[status] ?? 'text-[var(--color-sage)] bg-[var(--color-sand-light)]'
}

function EventRow({ event, tourId }: { event: SgtTournament; tourId: number }) {
  const start = new Date(event.start_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const isPlayable = event.status === 'In Progress' || event.status === 'Completed'

  return (
    <div className="border border-[var(--color-sand)] rounded-xl p-5 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg text-[var(--color-navy)] leading-snug">
            {event.name}
          </h3>
          <p className="mt-0.5 text-sm text-[var(--color-sage)]">{event.courseName}</p>
          <p className="mt-1 text-xs font-mono text-[var(--color-sage)] tracking-wide">{start}</p>
        </div>
        <span
          className={`flex-shrink-0 text-xs font-mono uppercase tracking-widest rounded-full px-3 py-1 ${statusBadge(event.status)}`}
        >
          {event.status}
        </span>
      </div>
      {isPlayable && (
        <div className="mt-4 pt-4 border-t border-[var(--color-sand-light)]">
          <Link
            href={`/tournaments/${tourId}/${event.tournamentId}`}
            className="text-xs font-mono uppercase tracking-widest text-[var(--color-navy)] hover:text-[var(--color-gold-dark)] transition-colors"
          >
            View Leaderboard →
          </Link>
        </div>
      )}
    </div>
  )
}

export default async function TourDetailPage({ params }: Props) {
  const { tourId: tourIdStr } = await params
  const tourId = Number(tourIdStr)

  if (isNaN(tourId)) return null

  const [tours, tournaments, grossStandings, netStandings] = await Promise.all([
    getTours().catch(() => [] as SgtTour[]),
    getTournaments(tourId).catch(() => [] as SgtTournament[]),
    getStandings(tourId, 'gross').catch(() => []),
    getStandings(tourId, 'net').catch(() => []),
  ])

  // Best-effort tour header — falls back to a generic label if tours API flaked
  const tour = tours.find((t) => t.tourId === tourId)

  const sorted = [...tournaments].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-mono text-[var(--color-sage)] mb-8">
        <Link href="/tournaments" className="hover:text-[var(--color-navy)] transition-colors">
          Tournaments
        </Link>
        <span>/</span>
        <span className="text-[var(--color-navy)]">{tour?.name ?? `Tour ${tourId}`}</span>
      </nav>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-[var(--color-navy)] leading-tight">
            {tour?.name ?? `Tour ${tourId}`}
          </h1>
          {tour && (
            <p className="mt-1 text-sm font-mono text-[var(--color-sage)] tracking-wide">
              {new Date(tour.start_date).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}{' '}
              —{' '}
              {new Date(tour.end_date).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
        {tour && (tour.active === 1 ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[var(--color-navy)] bg-[var(--color-sage-light)] rounded-full px-3 py-1 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-navy)] animate-pulse" />
            Active
          </span>
        ) : (
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--color-sage)] bg-[var(--color-sand-light)] rounded-full px-3 py-1 flex-shrink-0">
            Past
          </span>
        ))}
      </div>

      {/* Standings */}
      <section className="mb-12">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-sage)] mb-5">
          Tour Standings
        </h2>
        <div className="border border-[var(--color-sand)] rounded-xl p-6 bg-white">
          {grossStandings.length === 0 && netStandings.length === 0 ? (
            <p className="text-sm text-[var(--color-sage)] italic">
              Standings not yet available.
            </p>
          ) : (
            <StandingsTable gross={grossStandings} net={netStandings} />
          )}
        </div>
      </section>

      {/* Events */}
      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-sage)] mb-5">
          Events
        </h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-[var(--color-sage)] italic">No events scheduled.</p>
        ) : (
          <div className="space-y-3">
            {sorted.map((event) => (
              <EventRow key={event.tournamentId} event={event} tourId={tourId} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
