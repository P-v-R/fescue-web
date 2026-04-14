'use client'

import { useState } from 'react'
import type { SgtStandingsEntry } from '@/lib/sgt/types'

type Props = {
  gross: SgtStandingsEntry[]
  net: SgtStandingsEntry[]
}

function isDifferent(a: SgtStandingsEntry[], b: SgtStandingsEntry[]) {
  if (a.length !== b.length || a.length === 0) return false
  return a.some((entry, i) => entry.user_name !== b[i]?.user_name || entry.points !== b[i]?.points)
}

export function StandingsTable({ gross, net }: Props) {
  const hasDistinctNet = isDifferent(gross, net)
  const [mode, setMode] = useState<'gross' | 'net'>('gross')
  const rows = mode === 'gross' ? gross : net

  return (
    <div>
      {/* Toggle — only shown when gross and net standings actually differ */}
      {hasDistinctNet && (
        <div className="flex gap-1 mb-6">
          {(['gross', 'net'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-xs font-mono uppercase tracking-widest rounded-full transition-colors ${
                mode === m
                  ? 'bg-[var(--color-navy)] text-[var(--color-cream)]'
                  : 'bg-[var(--color-sand-light)] text-[var(--color-navy)] hover:bg-[var(--color-sand)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-sage)] italic">No standings available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-sand)]">
                <th className="text-left pb-3 pr-4 font-mono text-xs uppercase tracking-widest text-[var(--color-sage)] w-10">
                  Pos
                </th>
                <th className="text-left pb-3 pr-4 font-mono text-xs uppercase tracking-widest text-[var(--color-sage)]">
                  Player
                </th>
                <th className="text-right pb-3 pr-4 font-mono text-xs uppercase tracking-widest text-[var(--color-sage)]">
                  HCP
                </th>
                <th className="text-right pb-3 pr-4 font-mono text-xs uppercase tracking-widest text-[var(--color-sage)]">
                  Events
                </th>
                <th className="text-right pb-3 pr-4 font-mono text-xs uppercase tracking-widest text-[var(--color-sage)]">
                  1st
                </th>
                <th className="text-right pb-3 pr-4 font-mono text-xs uppercase tracking-widest text-[var(--color-sage)]">
                  Top 5
                </th>
                <th className="text-right pb-3 font-mono text-xs uppercase tracking-widest text-[var(--color-gold-dark)]">
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr
                  key={entry.user_name}
                  className="border-b border-[var(--color-sand-light)] last:border-0 hover:bg-[var(--color-cream-dark)] transition-colors"
                >
                  <td className="py-3 pr-4 font-mono text-xs text-[var(--color-sage)]">
                    {entry.position}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-[var(--color-navy)]">
                    {entry.user_name}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-xs text-[var(--color-navy-light)]">
                    {entry.hcp > 0 ? `+${entry.hcp}` : entry.hcp}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-xs text-[var(--color-navy-light)]">
                    {entry.events}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-xs text-[var(--color-navy-light)]">
                    {entry.first}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-xs text-[var(--color-navy-light)]">
                    {entry.top5}
                  </td>
                  <td className="py-3 text-right font-mono text-sm font-semibold text-[var(--color-gold-dark)]">
                    {entry.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
