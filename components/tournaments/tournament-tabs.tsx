'use client'

import { useState, type ReactNode } from 'react'

type Tab = 'bracket' | 'field'

// Field + Bracket views as tabs. Defaults to the bracket once it's been drawn,
// otherwise the field. Both panels stay mounted (toggled with `hidden`) so the
// bracket's admin controls keep their state when switching tabs.
export function TournamentTabs({
  hasBracket,
  field,
  bracket,
}: {
  hasBracket: boolean
  field: ReactNode
  bracket: ReactNode
}) {
  const [tab, setTab] = useState<Tab>(hasBracket ? 'bracket' : 'field')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'bracket', label: 'Bracket' },
    { id: 'field', label: 'Field' },
  ]

  return (
    <div>
      <div className="mb-6 flex gap-0 border-b border-cream-mid">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              '-mb-px border-b-2 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors',
              tab === t.id ? 'border-gold text-navy' : 'border-transparent text-navy/45 hover:text-navy',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={tab === 'bracket' ? '' : 'hidden'}>{bracket}</div>
      <div className={tab === 'field' ? '' : 'hidden'}>{field}</div>
    </div>
  )
}
