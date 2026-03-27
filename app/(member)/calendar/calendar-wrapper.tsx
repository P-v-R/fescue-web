'use client'

import dynamic from 'next/dynamic'
import type { Event, EventRsvp } from '@/lib/supabase/types'
import CalendarLoading from './loading'

const CalendarClient = dynamic(
  () => import('./calendar-client').then((m) => ({ default: m.CalendarClient })),
  { ssr: false, loading: () => <CalendarLoading /> },
)

type Props = {
  initialEvents: Event[]
  initialUserRsvps: EventRsvp[]
  isAdmin: boolean
}

export function CalendarWrapper({ initialEvents, initialUserRsvps, isAdmin }: Props) {
  return <CalendarClient initialEvents={initialEvents} initialUserRsvps={initialUserRsvps} isAdmin={isAdmin} />
}
