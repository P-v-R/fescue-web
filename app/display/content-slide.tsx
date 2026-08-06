import type React from 'react'
import type { BulletinPost } from '@/lib/sanity/types'
import type { Event } from '@/lib/supabase/types'

export type DisplayContentItem =
  | { kind: 'post'; data: BulletinPost }
  | { kind: 'event'; data: Event }

type Props = {
  item: DisplayContentItem
}

/** Flattens a Sanity portable-text body into a single plain-text string. */
function extractPlainText(body: BulletinPost['body']): string {
  if (!body) return ''
  return body
    .filter((block) => block._type === 'block')
    .map((block) => {
      const children = (block as { children?: { text?: string }[] }).children ?? []
      return children.map((c) => c.text ?? '').join('')
    })
    .filter(Boolean)
    .join(' ')
}

/**
 * Trims text to ~`limit` characters on a word boundary so excerpts never cut
 * mid-word (e.g. "…fittings. Wh…"). Returns whether it was truncated so the
 * caller can append an ellipsis only when there's more.
 */
function clampText(str: string, limit: number): { text: string; truncated: boolean } {
  if (str.length <= limit) return { text: str, truncated: false }
  const clipped = str.slice(0, limit)
  const lastSpace = clipped.lastIndexOf(' ')
  const text = (lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped).replace(
    /[\s.,;:!?-]+$/,
    '',
  )
  return { text, truncated: true }
}

function SlideShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col items-center justify-center h-full px-24 text-center'>
      {/* Club mark */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src='/quail-alt.png'
        alt='Fescue Golf Club'
        width={104}
        height={104}
        className='mb-9'
        style={{ objectFit: 'contain' }}
      />

      {/* Category label */}
      <p
        className='font-mono uppercase tracking-[0.42em] text-gold mb-8'
        style={{ fontSize: '1.25rem' }}
      >
        {label}
      </p>

      {/* Divider */}
      <div className='flex items-center gap-4 mb-12 w-full max-w-4xl'>
        <div className='flex-1 h-px bg-cream/15' />
        <div className='w-2 h-2 bg-gold/55 rotate-45 shrink-0' />
        <div className='flex-1 h-px bg-cream/15' />
      </div>

      {children}
    </div>
  )
}

export function ContentSlide({ item }: Props) {
  if (item.kind === 'post') {
    const post = item.data
    const { text, truncated } = clampText(extractPlainText(post.body), 280)

    return (
      <SlideShell label='Bulletin Board'>
        <h2
          className='font-serif font-light text-cream leading-tight max-w-5xl mb-12'
          style={{ fontSize: '6.5rem' }}
        >
          {post.title}
        </h2>
        {text && (
          <p
            className='font-sans font-light text-cream/65 leading-relaxed max-w-4xl'
            style={{ fontSize: '2.25rem' }}
          >
            {text}
            {truncated ? '…' : ''}
          </p>
        )}
        {post.publishedAt && (
          <p
            className='font-mono uppercase tracking-[0.22em] text-cream/35 mt-14'
            style={{ fontSize: '1.25rem' }}
          >
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </SlideShell>
    )
  }

  // Event slide
  const event = item.data
  const startsAt = new Date(event.starts_at)
  const description = clampText(event.description ?? '', 220)

  return (
    <SlideShell label='Upcoming Event'>
      <h2
        className='font-serif font-light text-cream leading-tight max-w-5xl mb-10'
        style={{ fontSize: '6.5rem' }}
      >
        {event.title}
      </h2>
      <p
        className='font-mono uppercase tracking-[0.2em] text-gold'
        style={{ fontSize: '1.875rem' }}
      >
        {startsAt.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
        {' · '}
        {startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </p>
      {event.location && (
        <p
          className='font-mono uppercase tracking-[0.22em] text-cream/45 mt-4'
          style={{ fontSize: '1.25rem' }}
        >
          {event.location}
        </p>
      )}
      {description.text && (
        <p
          className='font-sans font-light text-cream/60 leading-relaxed max-w-4xl mt-12'
          style={{ fontSize: '2.25rem' }}
        >
          {description.text}
          {description.truncated ? '…' : ''}
        </p>
      )}
    </SlideShell>
  )
}
