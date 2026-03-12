import { PortableText } from '@portabletext/react'
import { format } from 'date-fns'
import type { BulletinPost } from '@/lib/sanity/types'

const portableTextComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="font-sans text-sm font-light text-navy-dark leading-relaxed mb-3 last:mb-0">
        {children}
      </p>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="font-serif text-xl font-light text-navy mt-4 mb-2">{children}</h3>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h4 className="font-serif text-label font-light text-navy mt-3 mb-1">{children}</h4>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-2 border-gold pl-4 my-3 font-serif italic text-base text-sand">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-medium text-navy">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
    link: ({
      value,
      children,
    }: {
      value?: { href: string }
      children?: React.ReactNode
    }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold underline underline-offset-2 hover:text-gold-light transition-colors"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-disc list-inside font-sans text-sm font-light text-navy-dark mb-3 space-y-1">
        {children}
      </ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside font-sans text-sm font-light text-navy-dark mb-3 space-y-1">
        {children}
      </ol>
    ),
  },
}

export function BulletinPostCard({ post }: { post: BulletinPost }) {
  return (
    <article
      className={[
        'bg-cream/30 border border-cream-mid relative overflow-hidden transition-shadow hover:shadow-sm',
        post.pinned ? 'border-l-[3px] border-l-gold' : 'border-l-[3px] border-l-navy/30',
      ].join(' ')}
    >
      {/* Top-right corner tick */}
      <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/20 pointer-events-none" />

      <div className="px-6 py-5">
        {/* Eyebrow: pinned badge + date */}
        <div className="flex items-center gap-3 mb-3">
          {post.pinned && (
            <span className="font-mono text-label uppercase tracking-[0.22em] text-cream bg-gold px-2.5 py-1">
              Pinned
            </span>
          )}
          {post.publishedAt && (
            <span className="font-mono text-label uppercase tracking-[0.18em] text-sand italic">
              {format(new Date(post.publishedAt), 'MMM d, yyyy')}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-serif text-xl font-normal text-navy mb-3 leading-snug">
          {post.title}
        </h2>

        {/* Body */}
        {post.body && post.body.length > 0 && (
          <div className="mt-1">
            <PortableText value={post.body} components={portableTextComponents} />
          </div>
        )}
      </div>
    </article>
  )
}
