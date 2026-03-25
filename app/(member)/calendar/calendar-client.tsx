'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core'
import { EventModal } from '@/components/calendar/event-modal'
import { fetchEventsForMonthAction } from './actions'
import type { Event, EventRsvp } from '@/lib/supabase/types'

type Props = {
  initialEvents: Event[]
  initialUserRsvps: EventRsvp[]
}

export function CalendarClient({ initialEvents, initialUserRsvps }: Props) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [userRsvps, setUserRsvps] = useState<EventRsvp[]>(initialUserRsvps)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleDatesSet = useCallback(async (arg: DatesSetArg) => {
    setIsLoading(true)
    try {
      const result = await fetchEventsForMonthAction(arg.view.currentStart.toISOString())
      if (result.data) setEvents(result.data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const eventsRef = useRef(events)
  useEffect(() => { eventsRef.current = events }, [events])

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const event = eventsRef.current.find((e) => e.id === arg.event.id)
    if (event) setSelectedEvent(event)
  }, [])

  const calendarEvents = useMemo(
    () => events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.starts_at, // full UTC timestamp — FullCalendar converts to browser local time
    })),
    [events],
  )

  function handleRsvpChange(eventId: string, status: 'going' | 'not_going' | null) {
    setUserRsvps((prev) => {
      const without = prev.filter((r) => r.event_id !== eventId)
      if (status === null) return without
      const existing = prev.find((r) => r.event_id === eventId)
      if (existing) return [...without, { ...existing, status }]
      return [
        ...without,
        {
          id: crypto.randomUUID(),
          event_id: eventId,
          member_id: '',
          status,
          created_at: new Date().toISOString(),
        },
      ]
    })
  }

  const selectedRsvpStatus = selectedEvent
    ? (userRsvps.find((r) => r.event_id === selectedEvent.id)?.status ?? null)
    : null

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
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          userRsvpStatus={selectedRsvpStatus}
          onRsvpChange={handleRsvpChange}
        />
      )}
    </div>
  )
}
