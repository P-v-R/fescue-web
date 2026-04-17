'use client'

import { useState } from 'react'
import type { SgtStandingsEntry } from '@/lib/sgt/types'

type Props = {
  gross: SgtStandingsEntry[]
  net: SgtStandingsEntry[]
  memberNames?: Record<string, string>
}

function isDifferent(a: SgtStandingsEntry[], b: SgtStandingsEntry[]) {
  if (a.length !== b.length || a.length === 0) return false
  return a.some((entry, i) => entry.user_name !== b[i]?.user_name || entry.points !== b[i]?.points)
}

function PositionBadge({ pos }: { pos: number | string }) {
  const pos1 = typeof pos === 'string' ? parseInt(pos, 10) : pos
  if (Number.isNaN(pos1)) return (
    <span className="font-mono text-[10px] text-navy/30 w-6 text-center shrink-0">{pos}</span>
  )
  if (pos1 === 1) return (
    <span className="inline-flex items-center justify-center w-6 h-6 bg-gold text-white font-mono text-[9px] font-semibold shrink-0">
      1
    </span>
  )
  if (pos1 === 2) return (
    <span className="inline-flex items-center justify-center w-6 h-6 bg-[#8a9db5] text-white font-mono text-[9px] font-semibold shrink-0">
      2
    </span>
  )
  if (pos1 === 3) return (
    <span className="inline-flex items-center justify-center w-6 h-6 bg-[#a0744a] text-white font-mono text-[9px] font-semibold shrink-0">
      3
    </span>
  )
  return (
    <span className="font-mono text-[10px] text-navy/30 w-6 text-center shrink-0">
      {pos}
    </span>
  )
}

export function StandingsTable({ gross, net, memberNames = {} }: Props) {
  const hasDistinctNet = isDifferent(gross, net)
  const [mode, setMode] = useState<'gross' | 'net'>('gross')
  const rows = mode === 'gross' ? gross : net

  return (
    <div>
      {/* Mode toggle */}
      {hasDistinctNet && (
        <div className="flex border-b border-cream-mid mb-5">
          {(['gross', 'net'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={[
                'px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] border-b-2 -mb-px transition-colors',
                mode === m
                  ? 'border-navy text-navy'
                  : 'border-transparent text-navy/35 hover:text-navy/60',
              ].join(' ')}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="font-serif italic text-sm text-navy/35">No standings available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cream-mid">
                <th className="text-left pb-3 pr-3 w-8" />
                <th className="text-left pb-3 pr-4 font-mono text-[9px] uppercase tracking-[0.2em] text-navy/35">
                  Player
                </th>
                <th className="text-right pb-3 pr-4 font-mono text-[9px] uppercase tracking-[0.2em] text-navy/35">
                  HCP
                </th>
                <th className="text-right pb-3 pr-4 font-mono text-[9px] uppercase tracking-[0.2em] text-navy/35">
                  Events
                </th>
                <th className="text-right pb-3 pr-4 font-mono text-[9px] uppercase tracking-[0.2em] text-navy/35">
                  1st
                </th>
                <th className="text-right pb-3 pr-4 font-mono text-[9px] uppercase tracking-[0.2em] text-navy/35">
                  Top 5
                </th>
                <th className="text-right pb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-gold/70">
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => {
                const posNum = typeof entry.position === 'string' ? parseInt(entry.position, 10) : entry.position
                const isTop3 = posNum <= 3
                return (
                  <tr
                    key={entry.user_name}
                    className={[
                      'border-b border-cream-mid/60 last:border-0 transition-colors',
                      isTop3 ? 'hover:bg-gold/5' : 'hover:bg-cream/60',
                    ].join(' ')}
                  >
                    <td className="py-3 pr-3">
                      <PositionBadge pos={entry.position} />
                    </td>
                    <td className="py-3 pr-4">
                      <span className={[
                        'font-serif font-light',
                        isTop3 ? 'text-navy text-base' : 'text-navy/80 text-sm',
                      ].join(' ')}>
                        {entry.user_name}
                        {memberNames[entry.user_name.toLowerCase()] && (
                          <span className="text-navy/40 font-light"> — {memberNames[entry.user_name.toLowerCase()]}</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-[10px] text-navy/40">
                      {entry.hcp > 0 ? `+${entry.hcp}` : entry.hcp}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-[10px] text-navy/40">
                      {entry.events}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-[10px] text-navy/40">
                      {entry.first}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-[10px] text-navy/40">
                      {entry.top5}
                    </td>
                    <td className="py-3 text-right">
                      <span className={[
                        'font-mono font-semibold',
                        isTop3 ? 'text-gold text-sm' : 'text-gold/70 text-xs',
                      ].join(' ')}>
                        {entry.points}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
