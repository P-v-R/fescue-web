'use client'

import { useState, useTransition } from 'react'
import { archiveMemberAction, unarchiveMemberAction } from './actions'

type Props = {
  memberId: string
  memberName: string
  isActive: boolean
}

export function ArchiveMemberButton({ memberId, memberName, isActive }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const action = isActive ? archiveMemberAction : unarchiveMemberAction
      const result = await action(memberId)
      if (result?.error) {
        setError(result.error)
        setConfirming(false)
      }
      // archiveMemberAction redirects on success; unarchive stays on page
    })
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-3 border border-red-200 bg-red-50 px-5 py-4">
        <p className="font-serif text-sm text-red-800 font-light">
          {isActive
            ? `Archive ${memberName}? They will be signed out immediately and lose all access.`
            : `Restore ${memberName}? They will regain full member access.`}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="font-mono text-xs uppercase tracking-[0.18em] text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 transition-colors"
          >
            {isPending ? 'Working…' : 'Confirm'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="font-mono text-xs uppercase tracking-[0.18em] text-navy/60 hover:text-navy px-4 py-2 transition-colors"
          >
            Cancel
          </button>
        </div>
        {error && <p className="font-mono text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setConfirming(true)}
        className={[
          'font-mono text-xs uppercase tracking-[0.18em] px-4 py-2 border transition-colors',
          isActive
            ? 'text-red-600 border-red-200 hover:bg-red-50'
            : 'text-sage border-sage/30 hover:bg-sage/10',
        ].join(' ')}
      >
        {isActive ? 'Archive Member' : 'Restore Member'}
      </button>
      {error && <p className="font-mono text-xs text-red-600">{error}</p>}
    </div>
  )
}
