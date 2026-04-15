'use client'

import { useState } from 'react'
import { cancelBookingAction } from '@/app/(member)/reservations/actions'

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)

  if (cancelled) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-navy/30">
        Cancelled
      </span>
    )
  }

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    const result = await cancelBookingAction(bookingId)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      setConfirming(false)
    } else {
      setCancelled(true)
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-red-500">
          Cancel booking?
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-navy/40 hover:text-navy transition-colors"
          >
            Keep
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-1 transition-colors disabled:opacity-40"
          >
            {loading ? 'Cancelling…' : 'Yes'}
          </button>
        </div>
        {error && (
          <p className="font-mono text-[9px] text-red-500 text-right">{error}</p>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-navy/35 hover:text-red-500 border border-cream-mid hover:border-red-200 px-3 py-1.5 transition-colors"
    >
      Cancel
    </button>
  )
}
