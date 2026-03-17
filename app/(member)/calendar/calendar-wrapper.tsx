'use client'

import dynamic from 'next/dynamic'
import type { Event, EventRsvp } from '@/lib/supabase/types'

const CalendarClient = dynamic(
  () => import('./calendar-client').then((m) => ({ default: m.CalendarClient })),
  { ssr: false },
)

type Props = {
  initialEvents: Event[]
  initialUserRsvps: EventRsvp[]
}

export function CalendarWrapper({ initialEvents, initialUserRsvps }: Props) {
  return <CalendarClient initialEvents={initialEvents} initialUserRsvps={initialUserRsvps} />
}
