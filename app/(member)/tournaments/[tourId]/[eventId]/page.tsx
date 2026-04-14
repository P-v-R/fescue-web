import Link from 'next/link'
import { getTours, getTournaments, getEventLeaderboards } from '@/lib/sgt/queries'
import { EventLeaderboard } from '@/components/sgt/event-leaderboard'
import type { SgtTour, SgtTournament } from '@/lib/sgt/types'

type Props = {
  params: Promise<{ tourId: string; eventId: string }>
}

export default async function EventLeaderboardPage({ params }: Props) {
  const { tourId: tourIdStr, eventId: eventIdStr } = await params
  const tourId = Number(tourIdStr)
  const eventId = Number(eventIdStr)

  if (isNaN(tourId) || isNaN(eventId)) return null

  const [tours, tournaments, leaderboards] = await Promise.all([
    getTours().catch(() => [] as SgtTour[]),
    getTournaments(tourId).catch(() => [] as SgtTournament[]),
    getEventLeaderboards(eventId).catch(() => ({ gross: [], net: [] })),
  ])

  const tour = tours.find((t) => t.tourId === tourId)
  const event = tournaments.find((t) => t.tournamentId === eventId)
  const { gross: grossLeaderboard, net: netLeaderboard } = leaderboards

  const roundNums = grossLeaderboard.flatMap((r) => r.rounds.map((rd) => rd.round))
  const roundCount = roundNums.length > 0 ? Math.max(...roundNums) : 1


  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-mono text-[var(--color-sage)] mb-8 flex-wrap">
        <Link href="/tournaments" className="hover:text-[var(--color-navy)] transition-colors">
          Tournaments
        </Link>
        <span>/</span>
        <Link
          href={`/tournaments/${tourId}`}
          className="hover:text-[var(--color-navy)] transition-colors"
        >
          {tour?.name ?? `Tour ${tourId}`}
        </Link>
        <span>/</span>
        <span className="text-[var(--color-navy)]">{event?.name ?? `Event ${eventId}`}</span>
      </nav>

      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[var(--color-navy)] leading-tight">
          {event?.name ?? `Event ${eventId}`}
        </h1>
        {event && (
          <>
            <p className="mt-1 text-sm text-[var(--color-sage)]">{event.courseName}</p>
            <p className="mt-1 text-xs font-mono text-[var(--color-sage)] tracking-wide">
              {new Date(event.start_date).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
            <div className="mt-3">
              <span
                className={`text-xs font-mono uppercase tracking-widest rounded-full px-3 py-1 ${
                  event.status === 'In Progress'
                    ? 'text-[var(--color-navy)] bg-[var(--color-sage-light)]'
                    : event.status === 'Completed'
                      ? 'text-[var(--color-sand-dark)] bg-[var(--color-sand-light)]'
                      : 'text-[var(--color-sage)] bg-[var(--color-sand-light)]'
                }`}
              >
                {event.status}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="border border-[var(--color-sand)] rounded-xl p-6 bg-white">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-sage)] mb-5">
          Leaderboard
        </h2>
        <EventLeaderboard
          gross={grossLeaderboard}
          net={netLeaderboard}
          roundCount={roundCount}
        />
      </div>
    </div>
  )
}
