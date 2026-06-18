import type React from 'react'
import type { BulletinPost } from '@/lib/sanity/types'
import type { Event } from '@/lib/supabase/types'

export type DisplayContentItem =
  | { kind: 'post'; data: BulletinPost }
  | { kind: 'event'; data: Event }

type Props = {
  item: DisplayContentItem
}

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
    .slice(0, 240)
}

function SlideShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col items-center justify-center h-full px-20 text-center'>
      {/* Club mark */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src='/quail-alt.png'
        alt='Fescue Golf Club'
        width={80}
        height={80}
        className='mb-7'
        style={{ objectFit: 'contain' }}
      />

      {/* Category label */}
      <p className='font-mono text-xs uppercase tracking-[0.38em] text-gold mb-7'>{label}</p>

      {/* Divider */}
      <div className='flex items-center gap-4 mb-10 w-full max-w-3xl'>
        <div className='flex-1 h-px bg-navy/15' />
        <div className='w-1.5 h-1.5 bg-gold/55 rotate-45 shrink-0' />
        <div className='flex-1 h-px bg-navy/15' />
      </div>

      {children}
    </div>
  )
}

export function ContentSlide({ item }: Props) {
  if (item.kind === 'post') {
    const post = item.data
    const excerpt = extractPlainText(post.body)

    return (
      <SlideShell label='Bulletin Board'>
        <h2
          className='font-serif font-light text-navy leading-tight max-w-3xl mb-10'
          style={{ fontSize: 'clamp(2.5rem, 4.5vw, 5rem)' }}
        >
          {post.title}
        </h2>
        {excerpt && (
          <p
            className='font-sans font-light text-navy/60 leading-relaxed max-w-2xl'
            style={{ fontSize: 'clamp(1.1rem, 1.6vw, 1.5rem)' }}
          >
            {excerpt}
            {excerpt.length >= 240 ? '…' : ''}
          </p>
        )}
        {post.publishedAt && (
          <p className='font-mono text-sm uppercase tracking-[0.22em] text-navy/35 mt-12'>
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

  return (
    <SlideShell label='Upcoming Event'>
      <h2
        className='font-serif font-light text-navy leading-tight max-w-3xl mb-10'
        style={{ fontSize: 'clamp(2.5rem, 4.5vw, 5rem)' }}
      >
        {event.title}
      </h2>
      <p
        className='font-mono uppercase tracking-[0.22em] text-gold'
        style={{ fontSize: 'clamp(1rem, 1.4vw, 1.25rem)' }}
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
        <p className='font-mono text-sm uppercase tracking-[0.22em] text-navy/45 mt-3'>
          {event.location}
        </p>
      )}
      {event.description && (
        <p
          className='font-sans font-light text-navy/55 leading-relaxed max-w-2xl mt-10'
          style={{ fontSize: 'clamp(1.1rem, 1.6vw, 1.5rem)' }}
        >
          {event.description.slice(0, 200)}
          {event.description.length > 200 ? '…' : ''}
        </p>
      )}
    </SlideShell>
  )
}
