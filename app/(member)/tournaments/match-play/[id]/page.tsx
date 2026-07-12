import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTournamentById } from '@/lib/supabase/queries/tournaments'
import { getRegistrationsForTournament } from '@/lib/supabase/queries/tournament-registrations'
import { RegistrationButton } from '@/components/tournaments/registration-button'
import type { TournamentStatus } from '@/lib/supabase/types'

type Props = {
  params: Promise<{ id: string }>
}

const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: 'Draft',
  registration: 'Registration Open',
  seeding: 'Seeding',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_STYLES: Record<TournamentStatus, string> = {
  draft: 'text-navy/40 bg-cream',
  registration: 'text-navy bg-sage/15',
  seeding: 'text-gold bg-gold/10',
  in_progress: 'text-navy bg-sage/15',
  completed: 'text-navy/50 bg-cream',
  cancelled: 'text-red-400 bg-red-50',
}

export default async function MatchPlayTournamentPage({ params }: Props) {
  const { id } = await params

  const tournament = await getTournamentById(id)
  if (!tournament) {
    return (
      <div className="max-w-3xl space-y-4">
        <Link href="/tournaments" className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/35 hover:text-navy">
          ← Tournaments
        </Link>
        <p className="font-serif italic text-navy/40">Tournament not found.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [registrations, memberRow] = await Promise.all([
    getRegistrationsForTournament(id),
    user
      ? supabase.from('members').select('sgt_username').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  const isRegistered = !!user && registrations.some((r) => r.member_id === user.id)
  const isFull = tournament.capacity != null && registrations.length >= tournament.capacity
  const hasSgtUsername = !!(memberRow.data as { sgt_username: string | null } | null)?.sgt_username
  const closesAt = tournament.registration_closes_at
    ? new Date(tournament.registration_closes_at)
    : null
  const registrationOpen = tournament.status === 'registration' && (!closesAt || closesAt > new Date())

  const formatLabel = tournament.format === 'single_elim' ? 'Single elimination' : 'Double elimination'

  return (
    <div className="max-w-3xl space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/35">
        <Link href="/tournaments" className="hover:text-navy transition-colors">
          Tournaments
        </Link>
        <span>/</span>
        <span className="text-navy/60">{tournament.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold mb-1">Match Play</p>
          <h1 className="font-serif text-2xl sm:text-display font-light text-navy leading-tight">
            {tournament.name}
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40">
            {formatLabel}
            {tournament.capacity != null && ` · ${registrations.length}/${tournament.capacity} players`}
            {tournament.capacity == null && ` · ${registrations.length} registered`}
          </p>
          <div className="w-12 h-px bg-gold mt-4" />
        </div>
        <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-3 py-1 shrink-0 mt-1 ${STATUS_STYLES[tournament.status]}`}>
          {STATUS_LABELS[tournament.status]}
        </span>
      </div>

      {tournament.description && (
        <p className="font-sans text-sm text-navy/70 leading-relaxed whitespace-pre-line">
          {tournament.description}
        </p>
      )}

      {/* Registration */}
      {registrationOpen && (
        <div className="bg-white border border-cream-mid px-6 py-5 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/60">Registration</p>
              {closesAt && (
                <p className="font-mono text-[10px] text-navy/40 mt-1">
                  Closes {closesAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  {' at '}
                  {closesAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>
            <RegistrationButton
              tournamentId={tournament.id}
              isRegistered={isRegistered}
              isFull={isFull}
              hasSgtUsername={hasSgtUsername}
            />
          </div>
        </div>
      )}

      {!registrationOpen && tournament.status === 'registration' && (
        <div className="border border-cream-mid bg-cream/40 px-6 py-4">
          <p className="font-serif italic text-sm text-navy/50">Registration has closed.</p>
        </div>
      )}

      {/* Field / roster */}
      <section className="bg-white border border-cream-mid">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-cream-mid">
          <span className="text-gold/70 text-sm leading-none">◈</span>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/60">Field</p>
          <span className="ml-auto font-mono text-[10px] bg-gold/15 text-gold px-2 py-0.5 tracking-[0.1em]">
            {registrations.length}
          </span>
        </div>
        {registrations.length === 0 ? (
          <div className="px-6 py-5">
            <p className="font-serif italic text-sm text-navy/35">No players registered yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-cream-mid">
            {registrations.map((r, i) => (
              <li key={r.id} className="flex items-center gap-4 px-6 py-3">
                <span className="font-mono text-[10px] text-navy/30 w-6">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-serif text-sm font-light text-navy">
                  {r.members?.full_name ?? 'Unknown'}
                </span>
                {user && r.member_id === user.id && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-sage bg-sage/10 px-2 py-0.5">
                    You
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {(tournament.status === 'seeding' || tournament.status === 'in_progress' || tournament.status === 'completed') && (
        <p className="font-serif italic text-sm text-navy/35">
          The bracket will appear here once it&apos;s drawn.
        </p>
      )}
    </div>
  )
}
