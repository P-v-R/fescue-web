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
    .slice(0, 280)
}

export function ContentSlide({ item }: Props) {
  if (item.kind === 'post') {
    const post = item.data
    const excerpt = extractPlainText(post.body)

    return (
      <div className='flex flex-col items-center justify-center h-full px-16 text-center'>
        <p className='font-mono text-xs uppercase tracking-[0.30em] text-gold/70 mb-8'>
          Bulletin Board
        </p>
        <div className='flex items-center gap-3 mb-10 w-full max-w-2xl'>
          <div className='flex-1 h-px bg-cream/15' />
          <div className='w-1.5 h-1.5 bg-gold/50 rotate-45 shrink-0' />
          <div className='flex-1 h-px bg-cream/15' />
        </div>
        <h2 className='font-serif text-5xl font-light text-cream leading-tight max-w-2xl mb-8'>
          {post.title}
        </h2>
        {excerpt && (
          <p className='font-sans text-lg font-light text-cream/55 leading-relaxed max-w-xl'>
            {excerpt}
            {excerpt.length >= 280 ? '…' : ''}
          </p>
        )}
        {post.publishedAt && (
          <p className='font-mono text-xs uppercase tracking-[0.20em] text-cream/25 mt-10'>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    )
  }

  // Event slide
  const event = item.data
  const startsAt = new Date(event.starts_at)

  return (
    <div className='flex flex-col items-center justify-center h-full px-16 text-center'>
      <p className='font-mono text-xs uppercase tracking-[0.30em] text-gold/70 mb-8'>
        Upcoming Event
      </p>
      <div className='flex items-center gap-3 mb-10 w-full max-w-2xl'>
        <div className='flex-1 h-px bg-cream/15' />
        <div className='w-1.5 h-1.5 bg-gold/50 rotate-45 shrink-0' />
        <div className='flex-1 h-px bg-cream/15' />
      </div>
      <h2 className='font-serif text-5xl font-light text-cream leading-tight max-w-2xl mb-8'>
        {event.title}
      </h2>
      <p className='font-mono text-sm uppercase tracking-[0.22em] text-gold/80 mb-3'>
        {startsAt.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
        {' · '}
        {startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </p>
      {event.location && (
        <p className='font-mono text-xs uppercase tracking-[0.20em] text-cream/35 mt-2'>
          {event.location}
        </p>
      )}
      {event.description && (
        <p className='font-sans text-lg font-light text-cream/55 leading-relaxed max-w-xl mt-8'>
          {event.description.slice(0, 200)}
          {event.description.length > 200 ? '…' : ''}
        </p>
      )}
    </div>
  )
}
