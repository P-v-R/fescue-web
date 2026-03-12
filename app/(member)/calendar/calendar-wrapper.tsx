'use client'

import dynamic from 'next/dynamic'
import type { SocialEvent } from '@/lib/sanity/types'

const CalendarClient = dynamic(
  () => import('./calendar-client').then((m) => ({ default: m.CalendarClient })),
  { ssr: false },
)

export function CalendarWrapper({ initialEvents }: { initialEvents: SocialEvent[] }) {
  return <CalendarClient initialEvents={initialEvents} />
}
