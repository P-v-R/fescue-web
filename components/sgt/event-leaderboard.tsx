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

function toParClass(toPar: number): string {
  if (toPar < 0) return 'text-sage font-semibold'
  if (toPar === 0) return 'text-navy'
  return 'text-navy/40'
}

function PositionBadge({ pos }: { pos: number | string }) {
  const n = typeof pos === 'string' ? parseInt(pos, 10) : pos
  if (n === 1) return (
    <span className="inline-flex items-center justify-center w-6 h-6 bg-gold text-white font-mono text-[9px] font-semibold shrink-0">
      1
    </span>
  )
  if (n === 2) return (
    <span className="inline-flex items-center justify-center w-6 h-6 bg-navy/15 text-navy font-mono text-[9px] shrink-0">
      2
    </span>
  )
  if (n === 3) return (
    <span className="inline-flex items-center justify-center w-6 h-6 bg-cream text-navy/60 font-mono text-[9px] shrink-0">
      3
    </span>
  )
  return (
    <span className="font-mono text-[10px] text-navy/30 w-6 text-center shrink-0">
      {pos}
    </span>
  )
}

export function EventLeaderboard({ gross, net, roundCount }: Props) {
  const [mode, setMode] = useState<'gross' | 'net'>('gross')
  const rows = mode === 'gross' ? gross : net

  return (
    <div>
      {/* Mode toggle */}
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

      {rows.length === 0 ? (
        <p className="font-serif italic text-sm text-navy/35">No scores posted yet.</p>
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
                {Array.from({ length: roundCount }, (_, i) => (
                  <th
                    key={i}
                    className="text-right pb-3 pr-4 font-mono text-[9px] uppercase tracking-[0.2em] text-navy/35"
                  >
                    R{i + 1}
                  </th>
                ))}
                <th className="text-right pb-3 pr-4 font-mono text-[9px] uppercase tracking-[0.2em] text-navy/35">
                  Total
                </th>
                <th className="text-right pb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-navy/35">
                  To Par
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const toPar = mode === 'gross' ? row.toPar_gross : row.toPar_net
                const total = mode === 'gross' ? row.total_gross : row.total_net
                const posNum = typeof row.position === 'string' ? parseInt(row.position, 10) : row.position
                const isTop3 = posNum <= 3

                return (
                  <tr
                    key={row.player_name}
                    className={[
                      'border-b border-cream-mid/60 last:border-0 transition-colors',
                      isTop3 ? 'hover:bg-gold/5' : 'hover:bg-cream/60',
                    ].join(' ')}
                  >
                    <td className="py-3 pr-3">
                      <PositionBadge pos={row.position} />
                    </td>
                    <td className="py-3 pr-4">
                      <span className={[
                        'font-serif font-light',
                        isTop3 ? 'text-navy text-base' : 'text-navy/80 text-sm',
                      ].join(' ')}>
                        {row.player_name}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-[10px] text-navy/40">
                      {row.hcp_index > 0 ? `+${row.hcp_index}` : row.hcp_index}
                    </td>
                    {Array.from({ length: roundCount }, (_, ri) => {
                      const rd = row.rounds.find((r) => r.round === ri + 1)
                      const rdScore = rd
                        ? mode === 'gross' ? rd.total_gross : rd.total_net
                        : null
                      return (
                        <td key={ri} className="py-3 pr-4 text-right font-mono text-[10px] text-navy/40">
                          {rdScore ?? <span className="text-navy/20">—</span>}
                        </td>
                      )
                    })}
                    <td className="py-3 pr-4 text-right font-mono text-[10px] text-navy/60">
                      {total}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`font-mono text-sm ${toParClass(toPar)}`}>
                        {formatToPar(toPar)}
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
