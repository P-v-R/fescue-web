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

// Default SGT event settings; admin edits per round before starting.
const DEFAULT_SETTINGS = {
  courseId: '',
  numberholes: '18',
  greenspeed: '10',
  gimmes: '4',
  puttingmode: 'Casual',
  tees: 'Championship',
}

export function BracketBoard({ tournamentId, matches, players, isAdmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null)
  const [openForm, setOpenForm] = useState<string | null>(null)
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

  // Group matches into rounds: bracket → round → matches (position-ordered).
  const groups = new Map<string, RoundGroup>()
  for (const m of matches) {
    const key = `${m.bracket}:${m.round}`
    if (!groups.has(key)) groups.set(key, { bracket: m.bracket, round: m.round, matches: [] })
    groups.get(key)!.matches.push(m)
  }
  const sorted = [...groups.values()].sort((a, b) => a.round - b.round)
  // Winners rounds flow left→right, converging into the grand final.
  const topColumns = [
    ...sorted.filter((g) => g.bracket === 'winners'),
    ...sorted.filter((g) => g.bracket === 'grand_final'),
  ]
  const losersColumns = sorted.filter((g) => g.bracket === 'losers')

  function columnLabel(group: RoundGroup): string {
    if (group.bracket === 'grand_final') return 'Grand Final'
    return `Round ${group.round}`
  }

  function renderColumn(group: RoundGroup) {
    const key = `${group.bracket}:${group.round}`
    const playable = group.matches.filter(
      (m) => !m.is_bye && m.player1_registration_id && m.player2_registration_id,
    )
    const started = playable.some((m) => m.sgt_tournament_id)
    const canStart = isAdmin && playable.length > 0 && !started

    return (
      <div key={key} className="relative flex min-w-[240px] flex-col">
        {/* Fixed-height header keeps every column's match area vertically aligned */}
        <div className="flex h-8 shrink-0 items-center justify-between gap-2">
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-navy/50">
            {columnLabel(group)}
          </p>
          {canStart && (
            <button
              onClick={() => setOpenForm(openForm === key ? null : key)}
              className="shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] text-gold transition-colors hover:text-navy"
            >
              {openForm === key ? 'Cancel' : 'Start Round'}
            </button>
          )}
        </div>

        {/* Start-round settings form — absolutely positioned so it never shifts the tree */}
        {canStart && openForm === key && (
          <div className="absolute left-0 right-0 top-8 z-20 space-y-2 border border-cream-mid bg-cream p-3 shadow-lg">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-navy/40">SGT event settings</p>
            <input
              type="number"
              placeholder="SGT course ID *"
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              className="w-full border border-cream-mid bg-white px-2 py-1.5 font-sans text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.numberholes} onChange={(e) => setForm({ ...form, numberholes: e.target.value })} className="border border-cream-mid bg-white px-2 py-1.5 font-sans text-xs">
                <option value="18">18 holes</option>
                <option value="Front9">Front 9</option>
                <option value="Back9">Back 9</option>
              </select>
              <select value={form.puttingmode} onChange={(e) => setForm({ ...form, puttingmode: e.target.value })} className="border border-cream-mid bg-white px-2 py-1.5 font-sans text-xs">
                <option>Optimistic</option>
                <option>Casual</option>
                <option>Hard</option>
              </select>
              <select value={form.greenspeed} onChange={(e) => setForm({ ...form, greenspeed: e.target.value })} className="border border-cream-mid bg-white px-2 py-1.5 font-sans text-xs">
                {[8, 9, 10, 11, 12, 13].map((s) => <option key={s} value={s}>Green {s}</option>)}
              </select>
              <select value={form.gimmes} onChange={(e) => setForm({ ...form, gimmes: e.target.value })} className="border border-cream-mid bg-white px-2 py-1.5 font-sans text-xs">
                {['0', '2', '4', '5', '6', '8', '10', '99'].map((g) => <option key={g} value={g}>Gimmes {g}</option>)}
              </select>
            </div>
            <input
              type="text"
              placeholder="Tees"
              value={form.tees}
              onChange={(e) => setForm({ ...form, tees: e.target.value })}
              className="w-full border border-cream-mid bg-white px-2 py-1.5 font-sans text-sm"
            />
            <button
              disabled={isPending || !form.courseId}
              onClick={() => run(async () => {
                const r = await startRoundAction(tournamentId, group.bracket, group.round, settingsInput())
                if (!r.error) setOpenForm(null)
                return r
              })}
              className="w-full bg-navy py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cream hover:opacity-90 disabled:opacity-40"
            >
              Create SGT Event &amp; Start
            </button>
          </div>
        )}

        {/* Each match takes an equal share of the column height and centers within
            it — so a round's match sits at the midpoint of its two feeder matches. */}
        <div className="flex flex-1 flex-col">
          {group.matches.map((m) => (
            <div key={m.id} className="flex min-h-[108px] flex-1 items-center">
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
      <div className="flex items-stretch gap-8 overflow-x-auto pb-4">
        {topColumns.map(renderColumn)}
      </div>

      {/* Losers bracket, stacked below */}
      {losersColumns.length > 0 && (
        <div className="space-y-2 border-t border-cream-mid pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/40">Losers Bracket</p>
          <div className="flex items-stretch gap-8 overflow-x-auto pb-4">
            {losersColumns.map(renderColumn)}
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
  const p1 = match.player1_registration_id
  const p2 = match.player2_registration_id
  const winner = match.winner_registration_id
  const done = match.status === 'completed'

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
        {isAdmin && !done && !match.is_bye && p1 && p2 && (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {match.sgt_tournament_id && (
              <button onClick={onResolve} disabled={isPending} className="font-mono text-[9px] uppercase tracking-[0.12em] text-sage hover:text-navy disabled:opacity-40">
                Resolve
              </button>
            )}
            <details className="relative">
              <summary className="cursor-pointer list-none font-mono text-[9px] uppercase tracking-[0.12em] text-navy/40 hover:text-navy">More</summary>
              <div className="absolute right-0 top-full z-10 mt-1 w-40 space-y-1 border border-cream-mid bg-white p-2 shadow-sm">
                <button onClick={() => onForfeit(p2)} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
                  {playerName(players, p1)} wins (forfeit)
                </button>
                <button onClick={() => onForfeit(p1)} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
                  {playerName(players, p2)} wins (forfeit)
                </button>
                <div className="my-1 border-t border-cream-mid" />
                <button onClick={() => onDeclare(p1)} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
                  Declare {playerName(players, p1)}
                </button>
                <button onClick={() => onDeclare(p2)} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
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
            </details>
          </div>
        )}
      </div>
    </div>
  )
}
