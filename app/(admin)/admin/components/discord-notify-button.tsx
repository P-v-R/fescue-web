'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { notifyEventAction } from '../actions'
import type { Event } from '@/lib/supabase/types'

export function DiscordNotifyButton({ event }: { event: Event }) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    setResult(null)
    startTransition(async () => {
      const res = await notifyEventAction(event.id)
      setResult(res)
      if (!res.error) {
        setTimeout(() => setOpen(false), 1200)
      }
    })
  }

  function handleOpen() {
    setResult(null)
    setOpen(true)
  }

  const startDate = new Date(event.starts_at)

  return (
    <>
      <button
        onClick={handleOpen}
        className='font-mono text-[10px] uppercase tracking-[0.15em] border border-navy/20 text-navy/60 px-2.5 py-1 hover:border-navy/50 hover:text-navy transition-colors'
      >
        Post to Discord
      </button>

      {open && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4'
          onClick={() => !isPending && setOpen(false)}
        >
          {/* Backdrop */}
          <div className='absolute inset-0 bg-navy-dark/60 backdrop-blur-[2px]' />

          {/* Card */}
          <div
            className='relative w-full max-w-lg bg-cream border border-cream-mid shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner ticks */}
            <span className='absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/40' />
            <span className='absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/40' />
            <span className='absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/40' />
            <span className='absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/40' />

            {/* Header */}
            <div className='flex items-start justify-between px-7 pt-7 pb-4'>
              <div>
                <p className='font-mono text-[9px] uppercase tracking-[0.28em] text-gold mb-1'>
                  Post to Discord
                </p>
                <h2 className='font-serif text-xl font-light text-navy leading-snug'>
                  {event.title}
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                aria-label='Close'
                className='w-8 h-8 flex items-center justify-center text-navy/30 hover:text-navy transition-colors -mt-1 -mr-1'
              >
                <svg width='12' height='12' viewBox='0 0 12 12' fill='none'>
                  <path d='M1 1l10 10M11 1L1 11' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
                </svg>
              </button>
            </div>

            <div className='w-8 h-px bg-gold mx-7 mb-5' />

            {/* Body */}
            <div className='px-7 pb-7 space-y-4'>
              <p className='font-sans text-sm text-navy/70 leading-relaxed'>
                This will send a message to the Fescue Discord channel as <span className='font-semibold text-navy'>Fescue Bot</span> with the following event details:
              </p>

              <div className='bg-white border border-cream-mid p-4 space-y-1.5'>
                <p className='font-serif text-sm font-light text-navy'>{event.title}</p>
                <p className='font-mono text-[10px] text-navy/50 uppercase tracking-[0.12em]'>
                  {format(startDate, 'EEEE, MMMM d · h:mm a')}
                </p>
                {event.location && (
                  <p className='font-mono text-[10px] text-navy/40 uppercase tracking-[0.12em]'>
                    {event.location}
                  </p>
                )}
                {event.description && (
                  <p className='font-sans text-xs text-navy/50 pt-1 line-clamp-2'>
                    {event.description}
                  </p>
                )}
                <p className='font-mono text-[10px] text-sage tracking-[0.1em] pt-0.5'>
                  Includes a link → fescuegolfclub.com/events/{event.id.slice(0, 8)}…
                </p>
              </div>

              <p className='font-mono text-[9px] uppercase tracking-[0.15em] text-navy/35'>
                Members who see this message will need to log in to view the full event and RSVP.
              </p>

              {result?.error && (
                <p className='font-mono text-[10px] text-red-600 tracking-[0.1em]'>{result.error}</p>
              )}
              {result?.success && (
                <p className='font-mono text-[10px] text-sage tracking-[0.1em]'>✓ {result.success}</p>
              )}

              <div className='flex gap-3 pt-1'>
                <button
                  onClick={handleConfirm}
                  disabled={isPending || !!result?.success}
                  className='bg-navy text-cream font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50'
                >
                  {isPending ? 'Sending…' : result?.success ? 'Sent ✓' : 'Send to Discord'}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className='border border-cream-mid text-navy/50 font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 hover:border-navy/30 hover:text-navy transition-colors disabled:opacity-50'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
