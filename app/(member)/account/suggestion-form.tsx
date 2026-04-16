'use client'

import { useState, useTransition } from 'react'
import { submitSuggestionAction } from './actions'

export function SuggestionForm() {
  const [body, setBody] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      const res = await submitSuggestionAction({ body, anonymous })
      if (res.error) {
        setResult({ error: res.error })
      } else {
        setResult({ success: true })
        setBody('')
        setAnonymous(false)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="font-sans text-sm font-light text-navy/60 leading-relaxed">
        Share ideas, feedback, or anything on your mind — we read every one.
      </p>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={4}
        maxLength={2000}
        placeholder="What's on your mind?"
        className="w-full bg-cream border border-cream-mid px-4 py-3 font-sans text-sm font-light text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy/40 resize-none transition-colors"
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="accent-navy w-4 h-4"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/50">
            Submit anonymously
          </span>
        </label>

        {!anonymous && (
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-navy/30">
            Your name will be included
          </p>
        )}
      </div>

      {result?.error && (
        <p className="font-mono text-[10px] text-red-600 tracking-[0.1em]">{result.error}</p>
      )}

      {result?.success && (
        <p className="font-mono text-[10px] text-sage uppercase tracking-[0.15em]">
          ✓ Thanks — your suggestion was sent.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !body.trim()}
        className="bg-navy text-cream font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isPending ? 'Sending…' : 'Send Suggestion'}
      </button>
    </form>
  )
}
