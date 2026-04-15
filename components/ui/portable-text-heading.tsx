import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from 'sanity'

const components = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  },
  marks: {
    em: ({ children }: { children?: React.ReactNode }) => <em>{children}</em>,
  },
}

/**
 * Renders a Portable Text heading value (italic + line breaks only).
 * Each block becomes a line; multiple blocks are joined with <br />.
 */
export function PortableTextHeading({ value }: { value: PortableTextBlock[] }) {
  if (!Array.isArray(value) || value.length === 0) return null

  if (value.length === 1) {
    return <PortableText value={value} components={components} />
  }

  return (
    <>
      {value.map((block, i) => (
        <span key={block._key}>
          <PortableText value={[block]} components={components} />
          {i < value.length - 1 && <br />}
        </span>
      ))}
    </>
  )
}
