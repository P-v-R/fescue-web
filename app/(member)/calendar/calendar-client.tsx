'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core'
import { startOfMonth, endOfMonth } from 'date-fns'
import { sanityClient } from '@/lib/sanity/client'
import { EventModal } from '@/components/calendar/event-modal'
import type { SocialEvent } from '@/lib/sanity/types'

type Props = {
  initialEvents: SocialEvent[]
}

// Direct Sanity fetch without Next.js caching — for client-side month navigation
async function fetchEventsForMonth(month: Date): Promise<SocialEvent[]> {
  const start = startOfMonth(month).toISOString()
  const end = endOfMonth(month).toISOString()

  return sanityClient.fetch(
    `*[_type == "socialEvent" && date >= $start && date <= $end] | order(date asc) {
      _id, _type, title, description, date, location, image, rsvpUrl
    }`,
    { start, end },
  )
}

export function CalendarClient({ initialEvents }: Props) {
  const [events, setEvents] = useState<SocialEvent[]>(initialEvents)
  const [selectedEvent, setSelectedEvent] = useState<SocialEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleDatesSet = useCallback(async (arg: DatesSetArg) => {
    setIsLoading(true)
    try {
      const newEvents = await fetchEventsForMonth(arg.view.currentStart)
      setEvents(newEvents)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const eventsRef = useRef(events)
  useEffect(() => { eventsRef.current = events }, [events])

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const event = eventsRef.current.find((e) => e._id === arg.event.id)
    if (event) setSelectedEvent(event)
  }, [])

  const calendarEvents = useMemo(
    () => events.map((event) => ({
      id: event._id,
      title: event.title,
      date: event.date.split('T')[0],
    })),
    [events],
  )

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute top-2 right-2 z-10">
          <span className="font-mono text-label uppercase tracking-[0.2em] text-sand animate-pulse">
            Loading…
          </span>
        </div>
      )}

      <div className="bg-white border border-cream-mid p-4 sm:p-6">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          headerToolbar={{
            left: 'prev',
            center: 'title',
            right: 'next',
          }}
          height="auto"
          fixedWeekCount={false}
        />
      </div>

      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  )
}
