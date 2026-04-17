'use client'

import { useEffect } from 'react'

export function DarkModeApplier({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', enabled)
    return () => document.documentElement.classList.remove('dark-mode')
  }, [enabled])

  return null
}
