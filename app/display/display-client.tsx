'use client'

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { Bay, BookingWithMember, Event } from '@/lib/supabase/types'
import type { BulletinPost } from '@/lib/sanity/types'
import { interleaveItems } from '@/lib/utils/display'
import { BayStatusView } from './bay-status-view'
import { ContentSlide, type DisplayContentItem } from './content-slide'
import { DisplayErrorBoundary } from './display-error-boundary'

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

// The whole kiosk is laid out on a fixed design canvas and then scaled with CSS
// `zoom` to fill the physical screen. This keeps text a constant proportion of
// the display regardless of resolution — a 4K TV gets zoom ~2 (crisp, since
// `zoom` re-rasterizes text) while a 1080p monitor gets zoom 1 (unchanged).
const CANVAS_WIDTH = 1920
const CANVAS_HEIGHT = 1080
// Clamp the optional `?zoom=` multiplier so a stray large value can't make the
// browser allocate an enormous surface and hang the kiosk.
const MAX_ZOOM_MULTIPLIER = 3

type Phase = 'bays' | 'content'

/**
 * Fits the CANVAS_WIDTH × CANVAS_HEIGHT design canvas onto the current viewport.
 * Returns the scale factor plus whether CSS `zoom` is supported — `zoom` keeps
 * text crisp (it re-rasterizes), and callers fall back to `transform: scale()`
 * on browsers without it. An optional `?zoom=` URL multiplier (clamped) lets the
 * owner enlarge text beyond the fit (e.g. `&zoom=1.15`) without a code change.
 */
function useFitScale(): { scale: number; supportsZoom: boolean } {
  // Default to `zoom` (the target is a Chromium kiosk); the effect corrects to
  // the transform fallback after mount on the rare browser without zoom support.
  const [state, setState] = useState({ scale: 1, supportsZoom: true })

  useLayoutEffect(() => {
    const supportsZoom =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('zoom', '1')
    const compute = () => {
      const params = new URLSearchParams(window.location.search)
      const raw = parseFloat(params.get('zoom') ?? '')
      const multiplier =
        Number.isFinite(raw) && raw > 0 ? Math.min(raw, MAX_ZOOM_MULTIPLIER) : 1
      const fit = Math.min(
        window.innerWidth / CANVAS_WIDTH,
        window.innerHeight / CANVAS_HEIGHT,
      )
      setState({ scale: fit * multiplier, supportsZoom })
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  return state
}

export function DisplayClient({ bays, initialBookings, posts, events, token }: Props) {
  const { scale, supportsZoom } = useFitScale()
  const canvasStyle: CSSProperties = supportsZoom
    ? { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, zoom: scale }
    : {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }
  const [bookings, setBookings] = useState<BookingWithMember[]>(initialBookings)
  const [phase, setPhase] = useState<Phase>('bays')
  const [contentIdx, setContentIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Interleave posts and events so rotation alternates: post → event → post → event …
  const contentItems = useMemo(
    () =>
      interleaveItems(
        posts.map((p): DisplayContentItem => ({ kind: 'post', data: p })),
        events.map((e): DisplayContentItem => ({ kind: 'event', data: e })),
      ),
    [posts, events],
  )

  // Poll the server-side API route every 30 seconds — bypasses RLS via admin client
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/display/bookings', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setBookings(data as BookingWithMember[])
      } catch {
        // silently ignore — keep showing stale data
      }
    }
    const interval = setInterval(fetchBookings, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [token])

  // Reload once per day so Sanity posts and events stay fresh
  useEffect(() => {
    const now = new Date()
    const msUntilReload = new Date(now).setHours(24, 5, 0, 0) - now.getTime()
    const timer = setTimeout(() => window.location.reload(), msUntilReload)
    return () => clearTimeout(timer)
  }, [])

  // Cycling loop
  useEffect(() => {
    const duration = phase === 'bays' ? BAYS_DURATION : CONTENT_DURATION

    const timer = setTimeout(() => {
      // Fade out
      setVisible(false)

      // After fade, advance state and fade back in
      fadeTimerRef.current = setTimeout(() => {
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

    return () => {
      clearTimeout(timer)
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [phase, contentIdx, contentItems.length])

  const currentItem = contentItems[contentIdx] ?? null

  return (
    <div className='fixed inset-0 bg-navy-dark overflow-hidden flex items-center justify-center'>
      {/* Fixed design canvas scaled to fill the screen via CSS zoom */}
      <div className='relative' style={canvasStyle}>
        {/* Subtle corner decorations */}
        <span className='absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cream/15' />
        <span className='absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cream/15' />
        <span className='absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cream/15' />
        <span className='absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cream/15' />

        {/* Main content with fade transition */}
        <div
          className='h-full transition-opacity'
          style={{
            opacity: visible ? 1 : 0,
            transitionDuration: `${FADE_DURATION}ms`,
          }}
        >
          <DisplayErrorBoundary>
            {phase === 'bays' ? (
              <BayStatusView bays={bays} bookings={bookings} />
            ) : currentItem ? (
              <ContentSlide item={currentItem} />
            ) : null}
          </DisplayErrorBoundary>
        </div>
      </div>
    </div>
  )
}
