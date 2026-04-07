'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format, addDays, startOfDay, endOfDay, isBefore } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { BayGrid } from '@/components/reservations/bay-grid'
import { MobileBayList } from '@/components/reservations/mobile-bay-list'
import { BookingModal } from '@/components/reservations/booking-modal'
import { BookingDetailModal } from '@/components/reservations/booking-detail-modal'
import { UpcomingReservationsDesktop, UpcomingReservationsMobile } from '@/components/reservations/upcoming-reservations-panel'
import type { Bay, Booking, BookingWithMember, BookingWithBay } from '@/lib/supabase/types'
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

export function ReservationsClient({ bays, initialBookings, userId, blackoutPeriods: initialBlackoutPeriods }: Props) {
  const [date, setDate] = useState<Date>(startOfDay(new Date()))
  const [bookings, setBookings] = useState<BookingWithMember[]>(initialBookings)
  const [blackoutPeriods, setBlackoutPeriods] = useState<BlackoutPeriod[]>(initialBlackoutPeriods)
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithBay[]>([])
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<{ booking: BookingWithMember; bayName: string } | null>(null)
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

  const fetchBlackoutPeriods = useCallback(async () => {
    const supabase = supabaseRef.current
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('blackout_periods')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: true })
    setBlackoutPeriods((data as BlackoutPeriod[]) ?? [])
  }, [])

  const fetchUpcomingBookings = useCallback(async () => {
    const supabase = supabaseRef.current
    const { data } = await supabase
      .from('bookings')
      .select('*, bays(name)')
      .eq('member_id', userId)
      .gt('start_time', new Date().toISOString())
      .is('cancelled_at', null)
      .order('start_time', { ascending: true })
    setUpcomingBookings((data as BookingWithBay[]) ?? [])
  }, [userId])

  useEffect(() => {
    fetchUpcomingBookings()
  }, [fetchUpcomingBookings])

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

  // Realtime subscriptions — refresh grid when bookings or blackout periods change
  // NOTE: Realtime must be enabled in Supabase dashboard for both tables
  // (Database → Replication → Tables → enable bookings + blackout_periods)
  useEffect(() => {
    const supabase = supabaseRef.current
    const channel = supabase
      .channel('reservations-grid')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings(date)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blackout_periods' }, () => {
        fetchBlackoutPeriods()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [date, fetchBookings, fetchBlackoutPeriods])

  // Fetch when date changes (skip first render — we have initialBookings for today)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    fetchBookings(date)
  }, [date, fetchBookings])

  function handleUpcomingCancelled(id: string) {
    setUpcomingBookings((prev) => prev.filter((b) => b.id !== id))
    // Also remove from the grid if it's on the currently viewed date
    setBookings((prev) => prev.filter((b) => b.id !== id))
    showToast('Booking cancelled.')
  }

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
      {/* ── Mobile layout ── */}
      <div className='sm:hidden'>
        <MobileBayList
          bays={bays}
          bookings={bookings}
          date={date}
          setDate={(d) => setDate(startOfDay(d))}
          userId={userId}
          onSlotClick={setSelectedSlot}
          onBookingClick={(booking, bayName) => setSelectedBooking({ booking, bayName })}
          blackoutPeriods={periodsForDate}
        />
        <UpcomingReservationsMobile
          bookings={upcomingBookings}
          onCancelled={handleUpcomingCancelled}
        />
      </div>

      {/* ── Desktop layout ── */}
      <div className='hidden sm:block'>
        {/* Date picker row */}
        <div className="flex items-center gap-5 mb-6 flex-wrap">
          <label className="font-mono text-label uppercase tracking-[0.28em] text-sage">
            Date
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDate(startOfDay(addDays(date, -1)))}
              disabled={isBefore(addDays(date, -1), today)}
              className="w-7 h-7 flex items-center justify-center text-navy/40 disabled:opacity-20 hover:text-navy transition-colors"
              aria-label="Previous day"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
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
            <button
              onClick={() => setDate(startOfDay(addDays(date, 1)))}
              disabled={isBefore(maxDate, addDays(date, 1))}
              className="w-7 h-7 flex items-center justify-center text-navy/40 disabled:opacity-20 hover:text-navy transition-colors"
              aria-label="Next day"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <span className="font-serif italic text-base text-sand">
            {format(date, 'EEEE, MMMM d')}
          </span>
          {isLoading && (
            <span className="font-mono text-label uppercase tracking-[0.2em] text-sand animate-pulse">
              Updating…
            </span>
          )}
        </div>

        {/* Blackout banner */}
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
          onBookingClick={(booking, bayName) => setSelectedBooking({ booking, bayName })}
          blackoutPeriods={periodsForDate}
        />

        <UpcomingReservationsDesktop
          bookings={upcomingBookings}
          onCancelled={handleUpcomingCancelled}
        />
      </div>

      {/* Booking detail modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking.booking}
          bayName={selectedBooking.bayName}
          onClose={() => setSelectedBooking(null)}
          onCancelled={(id) => {
            setBookings((prev) => prev.filter((b) => b.id !== id))
            setUpcomingBookings((prev) => prev.filter((b) => b.id !== id))
            showToast('Booking cancelled.')
          }}
        />
      )}

      {/* New booking modal */}
      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          userId={userId}
          onClose={() => setSelectedSlot(null)}
          onSuccess={(booking) => {
            const slot = selectedSlot
            setSelectedSlot(null)
            setBookings((prev) => [...prev, { ...booking, members: null }])
            setUpcomingBookings((prev) =>
              [...prev, { ...booking, bays: { name: slot.bayName } }].sort(
                (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
              )
            )
            showToast(`Booked — ${slot.bayName} at ${format(new Date(booking.start_time), 'h:mm a')}`)
          }}
        />
      )}

      {/* Toast notification — raised on mobile so it doesn't overlap the FAB */}
      {toast && (
        <div className="fixed bottom-20 right-6 z-50 sm:bottom-6 bg-navy text-cream px-5 py-3 shadow-xl">
          <span className="font-mono text-label uppercase tracking-[0.18em]">{toast}</span>
        </div>
      )}
    </div>
  )
}
