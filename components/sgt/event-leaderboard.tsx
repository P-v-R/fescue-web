'use client'

import { useState } from 'react'
import type { SgtLeaderboardRow } from '@/lib/sgt/types'

type Props = {
  gross: SgtLeaderboardRow[]
  net: SgtLeaderboardRow[]
  roundCount: number
}

function formatToPar(n: number): string {
  if (n === 0) return 'E'
  return n > 0 ? `+${n}` : String(n)
}

export function EventLeaderboard({ gross, net, roundCount }: Props) {
  const [mode, setMode] = useState<'gross' | 'net'>('gross')
  const rows = mode === 'gross' ? gross : net

  return (
    <div>
      {/* Toggle */}
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

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-sage)] italic">No scores posted yet.</p>
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
                {Array.from({ length: roundCount }, (_, i) => (
                  <th
                    key={i}
                    className="text-right pb-3 pr-4 font-mono text-xs uppercase tracking-widest text-[var(--color-sage)]"
                  >
                    R{i + 1}
                  </th>
                ))}
                <th className="text-right pb-3 pr-4 font-mono text-xs uppercase tracking-widest text-[var(--color-sage)]">
                  Total
                </th>
                <th className="text-right pb-3 font-mono text-xs uppercase tracking-widest text-[var(--color-gold-dark)]">
                  To Par
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const toPar = mode === 'gross' ? row.toPar_gross : row.toPar_net
                const total = mode === 'gross' ? row.total_gross : row.total_net
                const isUnderPar = toPar < 0

                return (
                  <tr
                    key={row.player_name}
                    className="border-b border-[var(--color-sand-light)] last:border-0 hover:bg-[var(--color-cream-dark)] transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono text-xs text-[var(--color-sage)]">
                      {row.position}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-[var(--color-navy)]">
                      {row.player_name}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-xs text-[var(--color-navy-light)]">
                      {row.hcp_index > 0 ? `+${row.hcp_index}` : row.hcp_index}
                    </td>
                    {Array.from({ length: roundCount }, (_, ri) => {
                      const rd = row.rounds.find((r) => r.round === ri + 1)
                      const rdScore = rd
                        ? mode === 'gross'
                          ? rd.total_gross
                          : rd.total_net
                        : null
                      return (
                        <td
                          key={ri}
                          className="py-3 pr-4 text-right font-mono text-xs text-[var(--color-navy-light)]"
                        >
                          {rdScore ?? '—'}
                        </td>
                      )
                    })}
                    <td className="py-3 pr-4 text-right font-mono text-xs text-[var(--color-navy-light)]">
                      {total}
                    </td>
                    <td
                      className={`py-3 text-right font-mono text-sm font-semibold ${
                        isUnderPar
                          ? 'text-[var(--color-navy)]'
                          : toPar === 0
                            ? 'text-[var(--color-sage)]'
                            : 'text-[var(--color-gold-dark)]'
                      }`}
                    >
                      {formatToPar(toPar)}
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
