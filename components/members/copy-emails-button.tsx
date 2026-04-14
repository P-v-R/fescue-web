'use client'

import { useState } from 'react'

export function CopyEmailsButton({ emails }: { emails: string[] }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(emails.join(','))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className='font-mono text-[11px] uppercase tracking-[0.18em] text-navy/50 hover:text-navy transition-colors border border-sand/50 hover:border-navy/30 px-3 py-1.5'
    >
      {copied ? 'Copied!' : `Copy ${emails.length} Emails`}
    </button>
  )
}
