'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format, addDays, startOfDay, endOfDay } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { BayGrid } from '@/components/reservations/bay-grid'
import { BookingModal } from '@/components/reservations/booking-modal'
import type { Bay, BookingWithMember } from '@/lib/supabase/types'
import type { BlackoutPeriod } from '@/lib/utils/blackout'

type SelectedSlot = {
  bayId: string
  bayName: string
  startTime: Date
}

type Props = {
  bays: Bay[]
  initialBookings: BookingWithMember[]
  userId: string
  blackoutPeriods: BlackoutPeriod[]
}

export function ReservationsClient({ bays, initialBookings, userId, blackoutPeriods }: Props) {
  const [date, setDate] = useState<Date>(startOfDay(new Date()))
  const [bookings, setBookings] = useState<BookingWithMember[]>(initialBookings)
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const isInitialMount = useRef(true)
  const supabaseRef = useRef(createClient())
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  const fetchBookings = useCallback(async (d: Date) => {
    setIsLoading(true)
    try {
      const supabase = supabaseRef.current
      const { data } = await supabase
        .from('bookings')
        .select('*, members(full_name)')
        .gte('start_time', startOfDay(d).toISOString())
        .lte('start_time', endOfDay(d).toISOString())
        .is('cancelled_at', null)
        .order('start_time', { ascending: true })

      setBookings((data as BookingWithMember[]) ?? [])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Realtime subscription — refresh grid when any booking changes
  // NOTE: Realtime must be enabled on the `bookings` table in Supabase dashboard
  // (Database → Replication → Tables → enable bookings)
  useEffect(() => {
    const supabase = supabaseRef.current
    const channel = supabase
      .channel('bookings-grid')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings(date)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [date, fetchBookings])

  // Fetch when date changes (skip first render — we have initialBookings for today)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    fetchBookings(date)
  }, [date, fetchBookings])

  function showToast(message: string) {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast(message)
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000)
  }

  const today = startOfDay(new Date())
  const maxDate = addDays(today, 30)

  const selectedDateStr = format(date, 'yyyy-MM-dd')
  const periodsForDate = blackoutPeriods.filter((p) => p.date === selectedDateStr)
  // Full-day all-bays blackout → show banner and disable grid entirely
  const fullDayBlackout = periodsForDate.find((p) => p.all_bays && !p.start_time)

  return (
    <div>
      {/* Date picker row */}
      <div className="flex items-center gap-5 mb-6 flex-wrap">
        <label className="font-mono text-label uppercase tracking-[0.28em] text-sage">
          Date
        </label>
        <input
          type="date"
          value={format(date, 'yyyy-MM-dd')}
          min={format(today, 'yyyy-MM-dd')}
          max={format(maxDate, 'yyyy-MM-dd')}
          onChange={(e) => {
            if (!e.target.value) return
            const [year, month, day] = e.target.value.split('-').map(Number)
            setDate(startOfDay(new Date(year, month - 1, day)))
          }}
          className={[
            'font-sans text-sm font-light text-navy-dark',
            'bg-transparent border-0 border-b border-sand-light pb-1',
            'outline-none focus:border-navy transition-colors duration-200',
          ].join(' ')}
        />
        <span className="font-serif italic text-base text-sand">
          {format(date, 'EEEE, MMMM d')}
        </span>
        {isLoading && (
          <span className="font-mono text-label uppercase tracking-[0.2em] text-sand animate-pulse">
            Updating…
          </span>
        )}
      </div>

      {/* Blackout banner — only shown for full-day all-bays closures */}
      {fullDayBlackout && (
        <div className="mb-6 border border-sand/40 bg-cream-mid/40 px-5 py-4 flex items-start gap-4">
          <div className="w-1 self-stretch bg-sand/60 shrink-0" />
          <div>
            <p className="font-mono text-label uppercase tracking-[0.22em] text-navy/60 mb-0.5">
              Bays Unavailable
            </p>
            <p className="font-serif italic text-base text-navy/50">
              {fullDayBlackout.reason ?? 'Bay Unavailable'}
            </p>
          </div>
        </div>
      )}

      {/* Bay grid */}
      <BayGrid
        bays={bays}
        bookings={bookings}
        date={date}
        userId={userId}
        onSlotClick={setSelectedSlot}
        blackoutPeriods={periodsForDate}
      />

      {/* Booking modal */}
      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          userId={userId}
          onClose={() => setSelectedSlot(null)}
          onSuccess={(booking) => {
            setSelectedSlot(null)
            setBookings((prev) => [...prev, { ...booking, members: null }])
            showToast(`Booked — ${selectedSlot.bayName} at ${format(new Date(booking.start_time), 'h:mm a')}`)
          }}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-cream px-5 py-3 shadow-xl">
          <span className="font-mono text-label uppercase tracking-[0.18em]">{toast}</span>
        </div>
      )}
    </div>
  )
}
