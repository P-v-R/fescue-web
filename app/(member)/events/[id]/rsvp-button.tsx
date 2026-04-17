'use client'

import { useState, useTransition } from 'react'
import { setRsvpAction } from '@/app/(member)/calendar/actions'

type Props = {
  eventId: string
  currentStatus: 'going' | 'not_going' | null
}

export function RsvpButton({ eventId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()

  function update(next: 'going' | 'not_going' | null) {
    startTransition(async () => {
      const result = await setRsvpAction(eventId, next)
      if (!result.error) setStatus(next)
    })
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => update(status === 'going' ? null : 'going')}
        disabled={isPending}
        className={[
          'font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 transition-all disabled:opacity-50',
          status === 'going'
            ? 'bg-navy text-cream shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)]'
            : 'border border-navy text-navy hover:bg-navy/5',
        ].join(' ')}
      >
        {status === 'going' ? '✓ Going' : 'Going'}
      </button>
      <button
        onClick={() => update(status === 'not_going' ? null : 'not_going')}
        disabled={isPending}
        className={[
          'font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 transition-all disabled:opacity-50',
          status === 'not_going'
            ? 'bg-navy/10 text-navy'
            : 'border border-cream-mid text-navy/40 hover:border-navy/30 hover:text-navy/60',
        ].join(' ')}
      >
        {status === 'not_going' ? '✓ Not Going' : 'Not Going'}
      </button>
    </div>
  )
}
