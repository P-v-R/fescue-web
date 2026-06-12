'use client'

import { useState, useEffect } from 'react'
import type { Bay, BookingWithMember } from '@/lib/supabase/types'

type Props = {
  bays: Bay[]
  bookings: BookingWithMember[]
}

function firstName(fullName: string | null | undefined): string {
  if (!fullName) return ''
  return fullName.split(' ')[0]
}

function getBayStatus(bay: Bay, bookings: BookingWithMember[], now: Date) {
  // Query already returns bookings ordered by start_time asc; filter preserves that order
  const bayBookings = bookings.filter((b) => b.bay_id === bay.id)

  const current = bayBookings.find(
    (b) => new Date(b.start_time) <= now && now < new Date(b.end_time),
  )
  const next = bayBookings.find((b) => new Date(b.start_time) > now)

  return { current, next }
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function BayStatusView({ bays, bookings }: Props) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const activeBays = bays.filter((b) => b.is_active)
  const clockStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className='flex flex-col h-full px-10 py-8'>
      {/* Header */}
      <div className='flex items-center justify-between mb-5'>
        <p className='font-mono text-sm uppercase tracking-[0.30em] text-gold'>
          Bay Status
        </p>
        <div className='flex items-center gap-6'>
          <p className='font-mono text-sm uppercase tracking-[0.18em] text-white/45'>
            {dateStr}
          </p>
          <p className='font-mono text-2xl font-medium tracking-[0.06em] text-white/75 tabular-nums'>
            {clockStr}
          </p>
        </div>
      </div>

      <div className='w-full h-px bg-gold/25 mb-5' />

      {/* Bay columns */}
      <div
        className='flex-1 grid gap-4'
        style={{ gridTemplateColumns: `repeat(${Math.max(activeBays.length, 1)}, 1fr)` }}
      >
        {activeBays.map((bay) => {
          const { current, next } = getBayStatus(bay, bookings, now)
          const isOccupied = !!current

          return (
            <div
              key={bay.id}
              className='relative flex flex-col overflow-hidden'
              style={{
                background: isOccupied ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.18)',
                border: isOccupied ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Gold top accent on occupied bays */}
              {isOccupied && (
                <div className='absolute top-0 inset-x-0 h-[3px] bg-gold' />
              )}

              {/* Bay header */}
              <div className='flex items-center justify-between px-6 pt-6 pb-5'>
                <p
                  className='font-mono text-sm uppercase tracking-[0.28em]'
                  style={{ color: isOccupied ? '#b8963c' : 'rgba(255,255,255,0.28)' }}
                >
                  {bay.name}
                </p>
                {isOccupied && (
                  <div className='flex items-center gap-2'>
                    <span className='w-2 h-2 rounded-full bg-gold animate-pulse' />
                    <span className='font-mono text-[10px] uppercase tracking-[0.22em] text-gold/70'>
                      Live
                    </span>
                  </div>
                )}
              </div>

              {/* NOW PLAYING — flex-1 so it fills top space */}
              <div
                className='flex-1 flex flex-col justify-end px-6 pb-7'
                style={{ borderBottom: '1px solid rgba(255,255,255,0.09)' }}
              >
                <p className='font-mono text-[11px] uppercase tracking-[0.28em] text-white/40 mb-5'>
                  Now Playing
                </p>
                {/* Name — always same font size so block height is consistent */}
                <p
                  className='font-serif font-light leading-[0.9]'
                  style={{
                    fontSize: 'clamp(3rem, 4.8vw, 5.5rem)',
                    color: current ? 'white' : 'rgba(255,255,255,0.12)',
                    fontStyle: current ? 'normal' : 'italic',
                  }}
                >
                  {current ? firstName(current.members?.full_name) : '—'}
                </p>
                {/* Time — always rendered to keep block height consistent; invisible when empty */}
                <p
                  className='font-mono text-base mt-4 tracking-[0.10em]'
                  style={{ color: current ? 'rgba(255,255,255,0.5)' : 'transparent' }}
                >
                  {current ? `until ${formatTime(new Date(current.end_time))}` : 'until —'}
                </p>
              </div>

              {/* UP NEXT */}
              <div className='px-6 py-6 shrink-0'>
                <p className='font-mono text-[11px] uppercase tracking-[0.28em] text-white/40 mb-4'>
                  Up Next
                </p>
                {/* Name — always same font size so block height is consistent */}
                <p
                  className='font-serif font-light leading-none'
                  style={{
                    fontSize: 'clamp(1.6rem, 2.6vw, 3rem)',
                    color: next ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.12)',
                    fontStyle: next ? 'normal' : 'italic',
                  }}
                >
                  {next ? firstName(next.members?.full_name) : '—'}
                </p>
                {/* Time — always rendered to keep block height consistent; invisible when empty */}
                <p
                  className='font-mono text-sm mt-2 tracking-[0.10em]'
                  style={{ color: next ? 'rgba(255,255,255,0.4)' : 'transparent' }}
                >
                  {next ? `at ${formatTime(new Date(next.start_time))}` : 'at —'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer ornament */}
      <div className='flex items-center gap-3 mt-5'>
        <div className='flex-1 h-px bg-white/10' />
        <div className='w-1.5 h-1.5 bg-gold/50 rotate-45 shrink-0' />
        <div className='flex-1 h-px bg-white/10' />
      </div>
    </div>
  )
}
