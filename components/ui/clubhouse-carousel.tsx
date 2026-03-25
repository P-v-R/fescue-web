'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

export type CarouselSlide = { url: string; alt: string }

const DURATION = 5500
const TRANSITION_MS = 900

export function ClubhouseCarousel({ slides }: { slides: CarouselSlide[] | null }) {
  const count = slides?.length ?? 0
  const [current, setCurrent] = useState(0)
  const [busy, setBusy] = useState(false)
  const [paused, setPaused] = useState(false)

  const go = useCallback(
    (idx: number) => {
      if (busy || count < 2) return
      setBusy(true)
      setCurrent(idx)
      setTimeout(() => setBusy(false), TRANSITION_MS)
    },
    [busy, count],
  )

  const next = useCallback(() => go((current + 1) % count), [go, current, count])
  const prev = useCallback(() => go((current - 1 + count) % count), [go, current, count])

  useEffect(() => {
    if (paused || count < 2) return
    const t = setTimeout(next, DURATION)
    return () => clearTimeout(t)
  }, [current, paused, count, next])

  if (!slides || slides.length === 0) {
    return (
      <div className='relative aspect-[4/3] sm:aspect-[16/9] bg-sand/30 border border-sand/40 flex items-center justify-center'>
        <p className='font-mono text-label uppercase tracking-[0.15em] text-navy/20'>
          Clubhouse Photos
        </p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes _fescue-progress { from { width: 0% } to { width: 100% } }
      `}</style>

      <div
        className='relative overflow-hidden group'
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Photo stack */}
        <div className='relative aspect-[4/3] sm:aspect-[16/9]'>
          {slides.map((slide, i) => (
            <div
              key={slide.url}
              className='absolute inset-0'
              style={{
                opacity: i === current ? 1 : 0,
                transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
                zIndex: i === current ? 1 : 0,
              }}
              aria-hidden={i !== current}
            >
              <Image
                src={slide.url}
                alt={slide.alt}
                fill
                className='object-cover'
                sizes='100vw'
                priority={i === 0}
              />
              {/* Bottom gradient for chrome legibility */}
              <div className='absolute inset-0 bg-gradient-to-t from-navy/50 via-navy/5 to-transparent pointer-events-none' />
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {count > 1 && (
          <div className='absolute top-0 left-0 right-0 h-[1px] bg-cream/10 z-20'>
            <div
              key={`p-${current}`}
              className='h-full bg-gold/60'
              style={{
                animation: paused
                  ? 'none'
                  : `_fescue-progress ${DURATION}ms linear forwards`,
              }}
            />
          </div>
        )}

        {/* Prev / Next ghost arrows */}
        {count > 1 && (
          <>
            <button
              onClick={prev}
              className='absolute left-0 top-0 bottom-0 w-20 flex items-center justify-start pl-5 sm:pl-7 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-400'
              aria-label='Previous photo'
            >
              <ArrowLeft />
            </button>
            <button
              onClick={next}
              className='absolute right-0 top-0 bottom-0 w-20 flex items-center justify-end pr-5 sm:pr-7 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-400'
              aria-label='Next photo'
            >
              <ArrowRight />
            </button>
          </>
        )}

        {/* Bottom chrome: counter + dash indicators */}
        <div className='absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 sm:px-8 py-5 z-10'>
          <span className='font-mono text-[10px] uppercase tracking-[0.3em] text-cream/45 select-none drop-shadow-sm'>
            {String(current + 1).padStart(2, '0')}&ensp;/&ensp;{String(count).padStart(2, '0')}
          </span>

          {count > 1 && (
            <div className='flex items-center gap-2'>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  className='py-3 flex items-center'
                >
                  <span
                    className='block h-[1px] transition-all duration-500 ease-in-out'
                    style={{
                      width: i === current ? 28 : 8,
                      backgroundColor:
                        i === current ? 'rgba(184,158,86,0.85)' : 'rgba(255,255,255,0.28)',
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ArrowLeft() {
  return (
    <svg
      width='26'
      height='26'
      viewBox='0 0 26 26'
      fill='none'
      className='text-cream drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]'
    >
      <line x1='21' y1='13' x2='5' y2='13' stroke='currentColor' strokeWidth='1.25' />
      <polyline
        points='12,6 5,13 12,20'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.25'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg
      width='26'
      height='26'
      viewBox='0 0 26 26'
      fill='none'
      className='text-cream drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]'
    >
      <line x1='5' y1='13' x2='21' y2='13' stroke='currentColor' strokeWidth='1.25' />
      <polyline
        points='14,6 21,13 14,20'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.25'
        strokeLinejoin='round'
      />
    </svg>
  )
}
