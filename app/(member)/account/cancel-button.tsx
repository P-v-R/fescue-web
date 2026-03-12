'use client'

import { useState } from 'react'
import { cancelBookingAction } from '@/app/(member)/reservations/actions'

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)

  if (cancelled) {
    return (
      <span className="font-mono text-label uppercase tracking-[0.15em] text-sand/60">
        Cancelled
      </span>
    )
  }

  async function handleCancel() {
    const ok = window.confirm('Cancel this booking?')
    if (!ok) return

    setIsLoading(true)
    setError(null)
    const result = await cancelBookingAction(bookingId)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setCancelled(true)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleCancel}
        disabled={isLoading}
        className="font-mono text-label uppercase tracking-[0.18em] text-red-400/70 border border-red-300/30 px-3 py-1 hover:text-red-500 hover:border-red-400/50 transition-colors disabled:opacity-40"
      >
        {isLoading ? 'Cancelling…' : 'Cancel'}
      </button>
      {error && (
        <p className="font-mono text-label uppercase tracking-[0.12em] text-red-500 text-right max-w-[180px]">
          {error}
        </p>
      )}
    </div>
  )
}
