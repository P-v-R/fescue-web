import Link from 'next/link'
import { getTours } from '@/lib/sgt/queries'
import type { SgtTour } from '@/lib/sgt/types'

export const metadata = {
  title: 'Tournaments — Fescue',
}

function TourCard({ tour }: { tour: SgtTour }) {
  const start = new Date(tour.start_date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
  const end = new Date(tour.end_date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <Link
      href={`/tournaments/${tour.tourId}`}
      className="block group border border-[var(--color-sand)] rounded-xl p-6 hover:border-[var(--color-navy)] hover:shadow-md transition-all bg-white"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-xl text-[var(--color-navy)] group-hover:text-[var(--color-navy-dark)] leading-snug">
            {tour.name}
          </h2>
          <p className="mt-1 text-sm font-mono text-[var(--color-sage)] tracking-wide">
            {start} — {end}
          </p>
          {tour.teamTour === 1 && (
            <span className="mt-3 inline-block text-xs font-mono uppercase tracking-widest text-[var(--color-gold-dark)] border border-[var(--color-gold)] rounded-full px-3 py-0.5">
              Team Tour
            </span>
          )}
        </div>
        <div className="flex-shrink-0">
          {tour.active === 1 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[var(--color-navy)] bg-[var(--color-sage-light)] rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-navy)] animate-pulse" />
              Active
            </span>
          ) : (
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--color-sage)] bg-[var(--color-sand-light)] rounded-full px-3 py-1">
              Past
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default async function TournamentsPage() {
  let tours: SgtTour[] = []
  let error: string | null = null

  try {
    tours = await getTours()
  } catch (e) {
    console.error('[tournaments] failed to load tours:', e)
    error = 'Tournament data is temporarily unavailable. Please try again shortly.'
  }

  const active = tours.filter((t) => t.active === 1)
  const past = tours.filter((t) => t.active !== 1)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-8">
        <p className="text-sm text-[var(--color-sage)]">
          Simulator Golf Tour — Fescue Golf Club
        </p>
        <div className="relative group">
          <span className="w-4 h-4 rounded-full border border-[var(--color-sand)] text-[var(--color-sage)] text-[10px] font-mono flex items-center justify-center cursor-default select-none hover:border-[var(--color-navy)] hover:text-[var(--color-navy)] transition-colors">
            i
          </span>
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="w-2 h-2 bg-white border-t border-l border-[var(--color-sand)] rotate-45 mx-auto -mb-1" />
            <div className="bg-white border border-[var(--color-sand)] rounded-lg shadow-md px-4 py-3 text-xs font-mono text-[var(--color-sage)] leading-relaxed">
              Data sourced from{' '}
              <a
                href="https://simulatorgolftour.com"
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto text-[var(--color-navy)] underline underline-offset-2 hover:text-[var(--color-gold-dark)] transition-colors"
              >
                simulatorgolftour.com
              </a>
              . If data appears missing, the SGT API may be temporarily unavailable — visit the site directly or contact{' '}
              <a
                href="mailto:sean@fescuegolfclub.com"
                className="pointer-events-auto text-[var(--color-navy)] underline underline-offset-2 hover:text-[var(--color-gold-dark)] transition-colors"
              >
                sean@fescuegolfclub.com
              </a>
              .
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-sage)] mb-4">
            Active
          </h2>
          <div className="space-y-3">
            {active.map((tour) => (
              <TourCard key={tour.tourId} tour={tour} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-sage)] mb-4">
            Past Tours
          </h2>
          <div className="space-y-3">
            {past.map((tour) => (
              <TourCard key={tour.tourId} tour={tour} />
            ))}
          </div>
        </section>
      )}

      {!error && tours.length === 0 && (
        <p className="text-sm text-[var(--color-sage)] italic">No tours found.</p>
      )}
    </div>
  )
}
