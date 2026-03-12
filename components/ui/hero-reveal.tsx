'use client'

import { useEffect, useRef } from 'react'

/**
 * Wraps hero content and adds `data-revealed` after mount,
 * triggering CSS transitions on `.hero-item` children.
 */
export function HeroReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Double rAF ensures the transition fires after the initial paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.dataset.revealed = 'true'
      })
    })
  }, [])

  return (
    <div ref={ref} data-revealed="false" className="contents">
      {children}
    </div>
  )
}
