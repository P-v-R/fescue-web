'use client'

import { useEffect, useRef } from 'react'

type Props = {
  children: React.ReactNode
  speed?: number // 0–1, default 0.3
  className?: string
}

// Wraps a decorative element and applies a subtle vertical parallax on scroll.
// The parent section must be position:relative for this to work correctly.
export function ParallaxDecor({ children, speed = 0.3, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function update() {
      if (!el) return
      const parent = el.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const vh = window.innerHeight
      // Progress: -1 (section below viewport) → 0 (centered) → 1 (above viewport)
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh
      el.style.transform = `translateY(${progress * speed * 120}px)`
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [speed])

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  )
}
