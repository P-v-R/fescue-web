'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  registerForTournamentAction,
  withdrawFromTournamentAction,
} from '@/app/(member)/tournaments/actions'

type Props = {
  tournamentId: string
  isRegistered: boolean
  isFull: boolean
  hasSgtUsername: boolean
}

export function RegistrationButton({ tournamentId, isRegistered, isFull, hasSgtUsername }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function act(fn: () => Promise<{ error?: string; success?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await fn()
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  if (isRegistered) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-navy bg-sage/15 px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sage" />
            You&apos;re registered
          </span>
          <button
            onClick={() => act(() => withdrawFromTournamentAction(tournamentId))}
            disabled={isPending}
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-navy/40 border border-cream-mid px-3 py-1.5 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-40"
          >
            {isPending ? 'Working…' : 'Withdraw'}
          </button>
        </div>
        {error && <p className="font-sans text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => act(() => registerForTournamentAction(tournamentId))}
        disabled={isPending || isFull}
        className="bg-navy text-cream font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isFull ? 'Tournament Full' : isPending ? 'Registering…' : 'Register →'}
      </button>
      {!hasSgtUsername && (
        <p className="font-sans text-xs text-navy/50">
          Add your Simulator Golf Tour username in{' '}
          <a href="/account" className="underline underline-offset-2 hover:text-navy">
            your account
          </a>{' '}
          so your rounds can be scored.
        </p>
      )}
      {error && <p className="font-sans text-sm text-red-600">{error}</p>}
    </div>
  )
}
