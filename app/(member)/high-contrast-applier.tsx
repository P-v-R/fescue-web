'use client'

import { useEffect } from 'react'

export function HighContrastApplier({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', enabled)
    return () => document.documentElement.classList.remove('high-contrast')
  }, [enabled])

  return null
}
