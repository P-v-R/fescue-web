import Link from 'next/link'
import { getTours, getTournaments, getEventLeaderboards } from '@/lib/sgt/queries'
import { EventLeaderboard } from '@/components/sgt/event-leaderboard'
import { getMemberNamesBySgtUsername } from '@/lib/supabase/queries/members'
import type { SgtTour, SgtTournament } from '@/lib/sgt/types'

type Props = {
  params: Promise<{ tourId: string; eventId: string }>
}

export default async function EventLeaderboardPage({ params }: Props) {
  const { tourId: tourIdStr, eventId: eventIdStr } = await params
  const tourId = Number(tourIdStr)
  const eventId = Number(eventIdStr)

  if (isNaN(tourId) || isNaN(eventId)) return null

  const [tours, tournaments, leaderboards, memberNames] = await Promise.all([
    getTours().catch(() => [] as SgtTour[]),
    getTournaments(tourId).catch(() => [] as SgtTournament[]),
    getEventLeaderboards(eventId).catch(() => ({ gross: [], net: [] })),
    getMemberNamesBySgtUsername().catch(() => ({} as Record<string, string>)),
  ])

  const tour = tours.find((t) => t.tourId === tourId)
  const event = tournaments.find((t) => t.tournamentId === eventId)
  const { gross: grossLeaderboard, net: netLeaderboard } = leaderboards

  const roundNums = grossLeaderboard.flatMap((r) => r.rounds.map((rd) => rd.round))
  const roundCount = roundNums.length > 0 ? Math.max(...roundNums) : 1

  const statusClass =
    event?.status === 'In Progress'
      ? 'text-navy bg-sage/15'
      : event?.status === 'Completed'
        ? 'text-navy/50 bg-cream'
        : 'text-navy/40 bg-cream'

  return (
    <div className="max-w-4xl space-y-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/35 flex-wrap">
        <Link href="/tournaments" className="hover:text-navy transition-colors">
          Tournaments
        </Link>
        <span>/</span>
        <Link href={`/tournaments/${tourId}`} className="hover:text-navy transition-colors">
          {tour?.name ?? `Tour ${tourId}`}
        </Link>
        <span>/</span>
        <span className="text-navy/60">{event?.name ?? `Event ${eventId}`}</span>
      </nav>

      {/* Event header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy leading-tight">
          {event?.name ?? `Event ${eventId}`}
        </h1>
        {event && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40">
              {event.courseName}
            </p>
            <span className="text-navy/20">·</span>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40">
              {new Date(event.start_date).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
            <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 ${statusClass}`}>
              {event.status}
            </span>
          </div>
        )}
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      {/* Leaderboard card */}
      <div className="bg-white border border-cream-mid">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-cream-mid">
          <span className="text-gold/70 text-sm leading-none">◈</span>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/60">
            Leaderboard
          </p>
          {grossLeaderboard.length > 0 && (
            <span className="ml-auto font-mono text-[10px] bg-gold/15 text-gold px-2 py-0.5 tracking-[0.1em]">
              {grossLeaderboard.length} players
            </span>
          )}
        </div>
        <div className="px-6 py-5">
          <EventLeaderboard
            gross={grossLeaderboard}
            net={netLeaderboard}
            roundCount={roundCount}
            memberNames={memberNames}
          />
        </div>
      </div>
    </div>
  )
}
