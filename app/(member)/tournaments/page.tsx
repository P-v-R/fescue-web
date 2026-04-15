import Link from 'next/link'
import { getTours } from '@/lib/sgt/queries'
import type { SgtTour } from '@/lib/sgt/types'

export const metadata = {
  title: 'Tournaments — Fescue',
}

function TourCard({ tour }: { tour: SgtTour }) {
  const start = new Date(tour.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const end = new Date(tour.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const isActive = tour.active === 1

  return (
    <Link
      href={`/tournaments/${tour.tourId}`}
      className="block group bg-white border border-cream-mid hover:border-navy/30 transition-colors"
    >
      <div className="px-6 py-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-lg font-light text-navy group-hover:text-navy-dark leading-snug">
            {tour.name}
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40">
            {start} — {end}
          </p>
          {tour.teamTour === 1 && (
            <span className="mt-2 inline-block font-mono text-[9px] uppercase tracking-[0.15em] text-gold border border-gold/40 px-2 py-0.5">
              Team Tour
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-navy bg-sage/15 px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-navy animate-pulse" />
              Active
            </span>
          ) : (
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-navy/35 bg-cream px-3 py-1">
              Past
            </span>
          )}
          <span className="font-mono text-[10px] text-navy/25 group-hover:text-gold transition-colors">
            →
          </span>
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
    <div className="max-w-3xl space-y-8">

      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold">
            Simulator Golf Tour
          </p>
          {/* Data source tooltip */}
          <div className="relative group">
            <span className="w-4 h-4 border border-cream-mid text-navy/30 text-[9px] font-mono flex items-center justify-center cursor-default select-none hover:border-navy/40 hover:text-navy/60 transition-colors">
              i
            </span>
            <div className="pointer-events-none absolute left-0 top-full mt-2 w-72 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="bg-white border border-cream-mid shadow-sm px-4 py-3">
                <p className="font-mono text-[10px] text-navy/50 leading-relaxed">
                  Data sourced from{' '}
                  <a
                    href="https://simulatorgolftour.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto text-navy underline underline-offset-2 hover:text-gold transition-colors"
                  >
                    simulatorgolftour.com
                  </a>
                  . The SGT API may be occasionally unavailable — visit the site directly if data is missing.
                </p>
              </div>
            </div>
          </div>
        </div>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy">Tournaments</h1>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 font-sans text-sm px-4 py-3">
          {error}
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/40 mb-3">
            Active
          </p>
          {active.map((tour) => (
            <TourCard key={tour.tourId} tour={tour} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/40 mb-3">
            Past Tours
          </p>
          {past.map((tour) => (
            <TourCard key={tour.tourId} tour={tour} />
          ))}
        </section>
      )}

      {!error && tours.length === 0 && (
        <p className="font-serif italic text-sm text-navy/35">No tours found.</p>
      )}
    </div>
  )
}
