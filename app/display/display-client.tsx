'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bay, BookingWithMember, Event } from '@/lib/supabase/types'
import type { BulletinPost } from '@/lib/sanity/types'
import { BayStatusView } from './bay-status-view'
import { ContentSlide, type DisplayContentItem } from './content-slide'

type Props = {
  bays: Bay[]
  initialBookings: BookingWithMember[]
  posts: BulletinPost[]
  events: Event[]
}

const BAYS_DURATION = 60_000   // 1 minute
const CONTENT_DURATION = 15_000 // 15 seconds
const FADE_DURATION = 700       // ms for opacity transition

type Phase = 'bays' | 'content'

export function DisplayClient({ bays, initialBookings, posts, events }: Props) {
  const [bookings, setBookings] = useState<BookingWithMember[]>(initialBookings)
  const [phase, setPhase] = useState<Phase>('bays')
  const [contentIdx, setContentIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  const supabaseRef = useRef(createClient())

  // Build flat content array: interleave posts and events
  const contentItems: DisplayContentItem[] = [
    ...posts.map((p): DisplayContentItem => ({ kind: 'post', data: p })),
    ...events.map((e): DisplayContentItem => ({ kind: 'event', data: e })),
  ]

  // Fetch today's bookings from the client side (for realtime refresh)
  const fetchBookings = useCallback(async () => {
    const supabase = supabaseRef.current
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

    const { data } = await supabase
      .from('bookings')
      .select('*, members(full_name)')
      .gte('start_time', start)
      .lte('start_time', end)
      .is('cancelled_at', null)
      .order('start_time', { ascending: true })

    if (data) setBookings(data as BookingWithMember[])
  }, [])

  // Realtime subscription — same pattern as reservations-client.tsx
  useEffect(() => {
    const supabase = supabaseRef.current
    const channel = supabase
      .channel('display-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchBookings])

  // Cycling loop
  useEffect(() => {
    const duration = phase === 'bays' ? BAYS_DURATION : CONTENT_DURATION

    const timer = setTimeout(() => {
      // Fade out
      setVisible(false)

      // After fade, advance state and fade back in
      setTimeout(() => {
        if (phase === 'bays') {
          if (contentItems.length > 0) {
            setPhase('content')
          }
          // If no content, stay on bays
        } else {
          const nextIdx = (contentIdx + 1) % Math.max(contentItems.length, 1)
          setContentIdx(nextIdx)
          setPhase('bays')
        }
        setVisible(true)
      }, FADE_DURATION)
    }, duration)

    return () => clearTimeout(timer)
  }, [phase, contentIdx, contentItems.length])

  const currentItem = contentItems[contentIdx] ?? null

  return (
    <div className='fixed inset-0 bg-navy-dark overflow-hidden'>
      {/* Subtle corner decorations */}
      <span className='absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold/20' />
      <span className='absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold/20' />
      <span className='absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold/20' />
      <span className='absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold/20' />

      {/* Fescue wordmark — top center */}
      <div className='absolute top-6 left-1/2 -translate-x-1/2'>
        <p className='font-mono text-[10px] uppercase tracking-[0.45em] text-cream/20'>
          Fescue Golf Club
        </p>
      </div>

      {/* Main content with fade transition */}
      <div
        className='h-full transition-opacity'
        style={{
          opacity: visible ? 1 : 0,
          transitionDuration: `${FADE_DURATION}ms`,
        }}
      >
        {phase === 'bays' ? (
          <div className='h-full pt-10'>
            <BayStatusView bays={bays} bookings={bookings} />
          </div>
        ) : currentItem ? (
          <ContentSlide item={currentItem} />
        ) : null}
      </div>
    </div>
  )
}
