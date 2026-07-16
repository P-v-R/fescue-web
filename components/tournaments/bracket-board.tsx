'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { TournamentMatch, MatchBracketName } from '@/lib/supabase/types'
import {
  startRoundAction,
  resolveMatchAction,
  forfeitMatchAction,
  declareMatchWinnerAction,
  regenerateRoundEventAction,
} from '@/app/(admin)/admin/tournament-actions'

export type PlayerInfo = { name: string; seed: number | null }

type Props = {
  tournamentId: string
  matches: TournamentMatch[]
  players: Record<string, PlayerInfo>
  isAdmin: boolean
}

type RoundGroup = { bracket: MatchBracketName; round: number; matches: TournamentMatch[] }

function playerName(players: Record<string, PlayerInfo>, id: string | null): string {
  if (!id) return '—'
  return players[id]?.name ?? 'Unknown'
}

const DEFAULT_SETTINGS = {
  courseId: '',
  numberholes: '18',
  greenspeed: '10',
  gimmes: '4',
  puttingmode: 'Casual',
  tees: 'Championship',
}

// Elbow connectors for a match wrapper. Exact because every match takes an equal
// flex share of its column, so a child's centre is the midpoint of its two feeders.
function connectorClasses(hasPrev: boolean, hasNext: boolean, position: number): string {
  const c: string[] = ['relative']
  // Incoming stub: horizontal line from the gap midpoint to the card's left edge.
  if (hasPrev) {
    c.push("before:content-[''] before:absolute before:right-full before:w-4 before:top-1/2 before:border-t before:border-navy/20")
  }
  // Outgoing elbow: horizontal from the card's centre to the gap midpoint, then a
  // vertical toward the pair's midpoint (down for the top feeder, up for the bottom).
  if (hasNext) {
    c.push(
      position % 2 === 0
        ? "after:content-[''] after:absolute after:left-full after:w-4 after:top-1/2 after:h-1/2 after:border-t after:border-r after:border-navy/20"
        : "after:content-[''] after:absolute after:left-full after:w-4 after:bottom-1/2 after:h-1/2 after:border-b after:border-r after:border-navy/20",
    )
  }
  return c.join(' ')
}

export function BracketBoard({ tournamentId, matches, players, isAdmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null)
  const [formKey, setFormKey] = useState<{ bracket: MatchBracketName; round: number } | null>(null)
  const [form, setForm] = useState({ ...DEFAULT_SETTINGS })

  function run(fn: () => Promise<{ error?: string; success?: string }>) {
    setMsg(null)
    startTransition(async () => {
      const r = await fn()
      if (r.error) setMsg({ text: r.error, error: true })
      else {
        setMsg({ text: r.success ?? 'Done.', error: false })
        router.refresh()
      }
    })
  }

  function settingsInput() {
    return {
      courseId: Number(form.courseId),
      numberholes: form.numberholes,
      greenspeed: Number(form.greenspeed),
      gimmes: form.gimmes,
      puttingmode: form.puttingmode,
      tees: form.tees,
    }
  }

  // Group matches into rounds (bracket → round), position-ordered.
  const groups = new Map<string, RoundGroup>()
  for (const m of matches) {
    const key = `${m.bracket}:${m.round}`
    if (!groups.has(key)) groups.set(key, { bracket: m.bracket, round: m.round, matches: [] })
    groups.get(key)!.matches.push(m)
  }
  const sorted = [...groups.values()].sort((a, b) => a.round - b.round)
  const winnersGroups = sorted.filter((g) => g.bracket === 'winners')
  const grandFinalGroups = sorted.filter((g) => g.bracket === 'grand_final')
  const losersGroups = sorted.filter((g) => g.bracket === 'losers')
  const topColumns = [...winnersGroups, ...grandFinalGroups]

  function renderColumn(group: RoundGroup, colIndex: number, totalWinners: number) {
    const key = `${group.bracket}:${group.round}`
    const playable = group.matches.filter(
      (m) => !m.is_bye && m.player1_registration_id && m.player2_registration_id,
    )
    const started = playable.some((m) => m.sgt_tournament_id)
    const canStart = isAdmin && playable.length > 0 && !started

    // Connectors only make sense for the winners bracket / single elim.
    const isWinners = group.bracket === 'winners'
    const hasPrev = isWinners && colIndex > 0
    const hasNext = isWinners && colIndex < totalWinners - 1

    return (
      <div key={key} className="flex min-w-[240px] flex-col">
        <div className="flex h-8 shrink-0 items-center justify-between gap-2">
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-navy/50">
            {group.bracket === 'grand_final' ? 'Grand Final' : `Round ${group.round}`}
          </p>
          {canStart && (
            <button
              onClick={() => { setForm({ ...DEFAULT_SETTINGS }); setFormKey({ bracket: group.bracket, round: group.round }) }}
              className="shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] text-gold transition-colors hover:text-navy"
            >
              Start Round
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          {group.matches.map((m) => (
            <div key={m.id} className={`flex min-h-[112px] flex-1 items-center ${connectorClasses(hasPrev, hasNext, m.position)}`}>
              <div className="w-full">
                <MatchCard
                  match={m}
                  players={players}
                  isAdmin={isAdmin}
                  isPending={isPending}
                  started={started}
                  onResolve={() => run(() => resolveMatchAction(m.id))}
                  onForfeit={(regId) => run(() => forfeitMatchAction(m.id, regId))}
                  onDeclare={(regId) => run(() => declareMatchWinnerAction(m.id, regId))}
                  onRegenerate={() => run(() => regenerateRoundEventAction(m.id, settingsInput()))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {msg && (
        <div
          className={`border px-4 py-2 font-sans text-sm ${
            msg.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-sage/30 bg-sage/10 text-sage-dark'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Winners bracket (+ grand final), converging left → right */}
      <div className="flex items-stretch gap-8 overflow-x-auto px-1 pb-4 pr-8">
        {topColumns.map((g) => renderColumn(g, winnersGroups.indexOf(g), winnersGroups.length))}
      </div>

      {/* Losers bracket, stacked below */}
      {losersGroups.length > 0 && (
        <div className="space-y-2 border-t border-cream-mid pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/40">Losers Bracket</p>
          <div className="flex items-stretch gap-8 overflow-x-auto px-1 pb-4 pr-8">
            {losersGroups.map((g) => renderColumn(g, -1, 0))}
          </div>
        </div>
      )}

      {/* Start-round settings — a fixed modal so it isn't clipped by the scroll row */}
      {formKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4" onClick={() => setFormKey(null)}>
          <div className="w-full max-w-sm space-y-3 border border-cream-mid bg-cream p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy/60">
              Start Round {formKey.round} — SGT event
            </p>
            <input
              type="number"
              placeholder="SGT course ID *"
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              className="w-full border border-cream-mid bg-white px-3 py-2 font-sans text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.numberholes} onChange={(e) => setForm({ ...form, numberholes: e.target.value })} className="border border-cream-mid bg-white px-2 py-2 font-sans text-xs">
                <option value="18">18 holes</option>
                <option value="Front9">Front 9</option>
                <option value="Back9">Back 9</option>
              </select>
              <select value={form.puttingmode} onChange={(e) => setForm({ ...form, puttingmode: e.target.value })} className="border border-cream-mid bg-white px-2 py-2 font-sans text-xs">
                <option>Optimistic</option>
                <option>Casual</option>
                <option>Hard</option>
              </select>
              <select value={form.greenspeed} onChange={(e) => setForm({ ...form, greenspeed: e.target.value })} className="border border-cream-mid bg-white px-2 py-2 font-sans text-xs">
                {[8, 9, 10, 11, 12, 13].map((s) => <option key={s} value={s}>Green {s}</option>)}
              </select>
              <select value={form.gimmes} onChange={(e) => setForm({ ...form, gimmes: e.target.value })} className="border border-cream-mid bg-white px-2 py-2 font-sans text-xs">
                {['0', '2', '4', '5', '6', '8', '10', '99'].map((g) => <option key={g} value={g}>Gimmes {g}</option>)}
              </select>
            </div>
            <input
              type="text"
              placeholder="Tees"
              value={form.tees}
              onChange={(e) => setForm({ ...form, tees: e.target.value })}
              className="w-full border border-cream-mid bg-white px-3 py-2 font-sans text-sm"
            />
            <div className="flex gap-2">
              <button
                disabled={isPending || !form.courseId}
                onClick={() => run(async () => {
                  const r = await startRoundAction(tournamentId, formKey.bracket, formKey.round, settingsInput())
                  if (!r.error) setFormKey(null)
                  return r
                })}
                className="flex-1 bg-navy py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cream hover:opacity-90 disabled:opacity-40"
              >
                Create SGT Event &amp; Start
              </button>
              <button
                onClick={() => setFormKey(null)}
                className="border border-cream-mid px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-navy/50 hover:text-navy"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MatchCard({
  match,
  players,
  isAdmin,
  isPending,
  started,
  onResolve,
  onForfeit,
  onDeclare,
  onRegenerate,
}: {
  match: TournamentMatch
  players: Record<string, PlayerInfo>
  isAdmin: boolean
  isPending: boolean
  started: boolean
  onResolve: () => void
  onForfeit: (regId: string) => void
  onDeclare: (regId: string) => void
  onRegenerate: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const p1 = match.player1_registration_id
  const p2 = match.player2_registration_id
  const winner = match.winner_registration_id
  const done = match.status === 'completed'
  const showAdmin = isAdmin && !done && !match.is_bye && !!p1 && !!p2

  function row(regId: string | null) {
    const isWinner = done && winner === regId
    const info = regId ? players[regId] : null
    return (
      <div className={`flex items-center justify-between gap-2 px-3 py-1.5 ${isWinner ? 'bg-sage/15' : ''}`}>
        <span className={`truncate font-sans text-sm ${isWinner ? 'font-medium text-navy' : 'text-navy/70'}`}>
          {info?.seed != null && <span className="mr-1.5 font-mono text-[9px] text-navy/30">{info.seed}</span>}
          {playerName(players, regId)}
        </span>
        {isWinner && <span className="text-xs text-gold">✓</span>}
      </div>
    )
  }

  return (
    <div className="border border-cream-mid bg-white">
      {row(p1)}
      <div className="border-t border-cream-mid" />
      {row(p2)}
      <div className="flex min-h-[32px] items-center justify-between gap-2 border-t border-cream-mid px-3 py-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-navy/40">
          {match.is_bye ? 'Bye' : done ? match.result_summary : started && match.sgt_tournament_id ? 'In play' : 'Pending'}
        </span>
        {showAdmin && (
          <div className="flex items-center gap-2">
            {match.sgt_tournament_id && (
              <button onClick={onResolve} disabled={isPending} className="font-mono text-[9px] uppercase tracking-[0.12em] text-sage hover:text-navy disabled:opacity-40">
                Resolve
              </button>
            )}
            <button onClick={() => setMenuOpen((v) => !v)} className="font-mono text-[9px] uppercase tracking-[0.12em] text-navy/40 hover:text-navy">
              {menuOpen ? 'Close' : 'More'}
            </button>
          </div>
        )}
      </div>

      {/* Inline admin menu — expands the card rather than overlaying, so it's never clipped */}
      {showAdmin && menuOpen && (
        <div className="space-y-1 border-t border-cream-mid bg-cream/40 px-3 py-2">
          <button onClick={() => onForfeit(p2!)} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
            {playerName(players, p1)} wins (forfeit)
          </button>
          <button onClick={() => onForfeit(p1!)} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
            {playerName(players, p2)} wins (forfeit)
          </button>
          <div className="my-1 border-t border-cream-mid" />
          <button onClick={() => onDeclare(p1!)} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
            Declare {playerName(players, p1)}
          </button>
          <button onClick={() => onDeclare(p2!)} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
            Declare {playerName(players, p2)}
          </button>
          {match.sgt_tournament_id && (
            <>
              <div className="my-1 border-t border-cream-mid" />
              <button onClick={onRegenerate} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
                Regenerate SGT event
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
