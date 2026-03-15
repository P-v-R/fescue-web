'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { PortableText } from '@portabletext/react'
import { urlFor } from '@/lib/sanity/client'
import type { SocialEvent } from '@/lib/sanity/types'

type Props = {
  event: SocialEvent
  onClose: () => void
}

export function EventModal({ event, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const date = new Date(event.date)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-dark/70 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centred on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      >
        <div
          className="relative bg-cream w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl rounded-t-2xl sm:rounded-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Corner ticks */}
          <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/40 z-10" />
          <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/40 z-10" />
          <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/40 z-10" />
          <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/40 z-10" />

          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-navy/20" />
          </div>

          {/* Close button — always visible whether image is present or not */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-cream/90 shadow-sm hover:bg-cream transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="#0a2b5e" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Event image */}
          {event.image && (
            <div className="relative w-full h-44 sm:h-56 overflow-hidden">
              <Image
                src={urlFor(event.image).width(600).height(300).url()}
                alt={event.title}
                fill
                className="object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/40 to-transparent" />
            </div>
          )}

          <div className="px-5 sm:px-8 py-5 sm:py-6">
            {/* Date eyebrow */}
            <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-2">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </p>

            {/* Title */}
            <h2 className="font-serif text-heading font-light text-navy leading-snug mb-4">
              {event.title}
            </h2>

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 mb-5 pb-5 border-b border-cream-mid">
              <MetaItem label="Time" value={format(date, 'h:mm a')} />
              {event.location && (
                <MetaItem label="Location" value={event.location} />
              )}
            </div>

            {/* Description */}
            {event.description && event.description.length > 0 && (
              <div className="prose-sm text-navy-dark mb-5">
                <PortableText
                  value={event.description}
                  components={{
                    block: {
                      normal: ({ children }) => (
                        <p className="font-sans text-sm font-light text-navy-dark leading-relaxed mb-3 last:mb-0">
                          {children}
                        </p>
                      ),
                    },
                  }}
                />
              </div>
            )}

            {/* RSVP */}
            {event.rsvpUrl && (
              <a
                href={event.rsvpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-mono text-label uppercase tracking-[0.22em] bg-navy text-cream px-6 py-3 shadow-[inset_0_0_0_1px_rgba(184,150,60,0.25)] hover:bg-navy-mid transition-colors duration-200"
              >
                RSVP →
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-label uppercase tracking-[0.22em] text-sage mb-0.5">{label}</p>
      <p className="font-sans text-sm font-light text-navy-dark">{value}</p>
    </div>
  )
}
