'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Bay, BookingWithMember, Event } from '@/lib/supabase/types'
import type { BulletinPost } from '@/lib/sanity/types'
import { BayStatusView } from './bay-status-view'
import { ContentSlide, type DisplayContentItem } from './content-slide'

type Props = {
  bays: Bay[]
  initialBookings: BookingWithMember[]
  posts: BulletinPost[]
  events: Event[]
  token: string
}

const BAYS_DURATION = 60_000   // 1 minute
const CONTENT_DURATION = 15_000 // 15 seconds
const FADE_DURATION = 700       // ms for opacity transition
const POLL_INTERVAL = 30_000    // 30 seconds

type Phase = 'bays' | 'content'

export function DisplayClient({ bays, initialBookings, posts, events, token }: Props) {
  const [bookings, setBookings] = useState<BookingWithMember[]>(initialBookings)
  const [phase, setPhase] = useState<Phase>('bays')
  const [contentIdx, setContentIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  // Build flat content array: interleave posts and events
  const contentItems: DisplayContentItem[] = [
    ...posts.map((p): DisplayContentItem => ({ kind: 'post', data: p })),
    ...events.map((e): DisplayContentItem => ({ kind: 'event', data: e })),
  ]

  // Poll the server-side API route — bypasses RLS via admin client
  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`/api/display/bookings?token=${token}`)
      if (!res.ok) return
      const data = await res.json()
      setBookings(data as BookingWithMember[])
    } catch {
      // silently ignore — keep showing stale data
    }
  }, [token])

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchBookings, POLL_INTERVAL)
    return () => clearInterval(interval)
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
      <span className='absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold/30' />
      <span className='absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold/30' />
      <span className='absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold/30' />
      <span className='absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold/30' />

      {/* Club logo — top center */}
      <div className='absolute top-4 left-1/2 -translate-x-1/2'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src='/Logo-no-border.png'
          alt='Fescue Golf Club'
          width={56}
          height={56}
          style={{ filter: 'brightness(0) invert(1)', opacity: 0.35 }}
        />
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
