'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import type { Bay } from '@/lib/supabase/types'
import { createBookingForMemberAction } from '@/app/(admin)/admin/actions'

const TIME_OPTIONS = Array.from({ length: 29 }, (_, i) => {
  const totalMins = 8 * 60 + i * 30
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const label = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
  return { value, label }
})

const DURATIONS = [60, 90, 120] as const

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function maxDateStr() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

type Props = {
  memberId: string
  memberName: string
  bays: Bay[]
}

export function BookForMemberModal({ memberId, memberName, bays }: Props) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(todayStr())
  const [bayId, setBayId] = useState(bays[0]?.id ?? '')
  const [time, setTime] = useState('10:00')
  const [duration, setDuration] = useState<60 | 90 | 120>(60)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const startTime = `${date}T${time}:00`
    const fd = new FormData()
    fd.set('member_id', memberId)
    fd.set('bay_id', bayId)
    fd.set('start_time', new Date(startTime).toISOString())
    fd.set('duration_minutes', String(duration))

    startTransition(async () => {
      const result = await createBookingForMemberAction(fd)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 1200)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-cream font-mono text-label uppercase tracking-[0.18em] hover:bg-navy-dark transition-colors shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)]"
      >
        Book a Bay
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Modal */}
          <div ref={dialogRef} className="relative bg-cream-light border border-cream-mid w-full max-w-md p-8 shadow-xl">
            <div className="mb-6">
              <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-1">Admin Booking</p>
              <h2 className="font-serif text-xl font-light text-navy">Book on behalf of</h2>
              <p className="font-serif text-lg font-light text-navy/60">{memberName}</p>
            </div>

            {success ? (
              <p className="font-serif italic text-sage text-lg">Booking created.</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Date */}
                <div>
                  <label className="font-mono text-label uppercase tracking-[0.18em] text-sand block mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    min={todayStr()}
                    max={maxDateStr()}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-white border border-cream-mid px-3 py-2 font-mono text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                {/* Bay */}
                <div>
                  <label className="font-mono text-label uppercase tracking-[0.18em] text-sand block mb-1">Bay</label>
                  <select
                    value={bayId}
                    onChange={(e) => setBayId(e.target.value)}
                    className="w-full bg-white border border-cream-mid px-3 py-2 font-mono text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                  >
                    {bays.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Time */}
                <div>
                  <label className="font-mono text-label uppercase tracking-[0.18em] text-sand block mb-1">Start Time</label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-white border border-cream-mid px-3 py-2 font-mono text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                  >
                    {TIME_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="font-mono text-label uppercase tracking-[0.18em] text-sand block mb-2">Duration</label>
                  <div className="flex gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={[
                          'flex-1 py-2 font-mono text-label uppercase tracking-[0.15em] border transition-colors',
                          duration === d
                            ? 'bg-navy text-cream border-navy'
                            : 'bg-white text-navy border-cream-mid hover:border-gold/40',
                        ].join(' ')}
                      >
                        {d}min
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="font-mono text-label text-red-500">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-2.5 bg-navy text-cream font-mono text-label uppercase tracking-[0.18em] hover:bg-navy-dark disabled:opacity-50 transition-colors shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)]"
                  >
                    {isPending ? 'Booking…' : 'Confirm Booking'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                    className="px-4 py-2.5 border border-cream-mid font-mono text-label uppercase tracking-[0.18em] text-navy hover:border-gold/40 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
