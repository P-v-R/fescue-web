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

const BRACKET_LABEL: Record<MatchBracketName, string> = {
  winners: 'Winners',
  losers: 'Losers',
  grand_final: 'Grand Final',
}

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
  // Which round-group's start form is open, keyed by "bracket:round".
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
    const courseId = Number(form.courseId)
    return {
      courseId,
      numberholes: form.numberholes,
      greenspeed: Number(form.greenspeed),
      gimmes: form.gimmes,
      puttingmode: form.puttingmode,
      tees: form.tees,
    }
  }

  // Group matches into rounds: bracket → round → matches.
  const groups = new Map<string, { bracket: MatchBracketName; round: number; matches: TournamentMatch[] }>()
  for (const m of matches) {
    const key = `${m.bracket}:${m.round}`
    if (!groups.has(key)) groups.set(key, { bracket: m.bracket, round: m.round, matches: [] })
    groups.get(key)!.matches.push(m)
  }
  const orderedGroups = [...groups.values()].sort(
    (a, b) =>
      ['winners', 'losers', 'grand_final'].indexOf(a.bracket) -
        ['winners', 'losers', 'grand_final'].indexOf(b.bracket) || a.round - b.round,
  )

  return (
    <div className="space-y-6">
      {msg && (
        <div
          className={`font-sans text-sm px-4 py-2 border ${
            msg.error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-sage/10 text-sage-dark border-sage/30'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex gap-6 overflow-x-auto pb-4">
        {orderedGroups.map((group) => {
          const key = `${group.bracket}:${group.round}`
          const playable = group.matches.filter(
            (m) => !m.is_bye && m.player1_registration_id && m.player2_registration_id,
          )
          const started = playable.some((m) => m.sgt_tournament_id)
          const canStart = isAdmin && playable.length > 0 && !started

          return (
            <div key={key} className="min-w-[260px] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy/50">
                  {group.bracket === 'grand_final' ? 'Grand Final' : `${BRACKET_LABEL[group.bracket]} · Round ${group.round}`}
                </p>
                {canStart && (
                  <button
                    onClick={() => setOpenForm(openForm === key ? null : key)}
                    className="font-mono text-[9px] uppercase tracking-[0.15em] text-gold hover:text-navy transition-colors"
                  >
                    {openForm === key ? 'Cancel' : 'Start Round'}
                  </button>
                )}
              </div>

              {/* Start-round SGT settings form */}
              {canStart && openForm === key && (
                <div className="border border-cream-mid bg-cream/40 p-3 space-y-2">
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
                    className="w-full bg-navy text-cream font-mono text-[10px] uppercase tracking-[0.18em] py-2 hover:opacity-90 disabled:opacity-40"
                  >
                    Create SGT Event & Start
                  </button>
                </div>
              )}

              {/* Matches */}
              {group.matches
                .sort((a, b) => a.position - b.position)
                .map((m) => (
                  <MatchCard
                    key={m.id}
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
                ))}
            </div>
          )
        })}
      </div>
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
        <span className={`font-sans text-sm truncate ${isWinner ? 'text-navy font-medium' : 'text-navy/70'}`}>
          {info?.seed != null && <span className="font-mono text-[9px] text-navy/30 mr-1.5">{info.seed}</span>}
          {playerName(players, regId)}
        </span>
        {isWinner && <span className="text-gold text-xs">✓</span>}
      </div>
    )
  }

  return (
    <div className="border border-cream-mid bg-white">
      {row(p1)}
      <div className="border-t border-cream-mid" />
      {row(p2)}
      <div className="px-3 py-1.5 border-t border-cream-mid flex items-center justify-between gap-2 min-h-[32px]">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-navy/40">
          {match.is_bye ? 'Bye' : done ? match.result_summary : started && match.sgt_tournament_id ? 'In play' : 'Pending'}
        </span>
        {isAdmin && !done && !match.is_bye && p1 && p2 && (
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {match.sgt_tournament_id && (
              <button onClick={onResolve} disabled={isPending} className="font-mono text-[9px] uppercase tracking-[0.12em] text-sage hover:text-navy disabled:opacity-40">
                Resolve
              </button>
            )}
            <details className="relative">
              <summary className="list-none cursor-pointer font-mono text-[9px] uppercase tracking-[0.12em] text-navy/40 hover:text-navy">More</summary>
              <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-cream-mid shadow-sm p-2 space-y-1 w-40">
                <button onClick={() => onForfeit(p2)} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
                  {playerName(players, p1)} wins (forfeit)
                </button>
                <button onClick={() => onForfeit(p1)} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
                  {playerName(players, p2)} wins (forfeit)
                </button>
                <div className="border-t border-cream-mid my-1" />
                <button onClick={() => onDeclare(p1)} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
                  Declare {playerName(players, p1)}
                </button>
                <button onClick={() => onDeclare(p2)} disabled={isPending} className="block w-full text-left font-mono text-[9px] uppercase tracking-[0.1em] text-navy/60 hover:text-navy">
                  Declare {playerName(players, p2)}
                </button>
                {match.sgt_tournament_id && (
                  <>
                    <div className="border-t border-cream-mid my-1" />
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
