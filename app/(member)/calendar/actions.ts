'use server'

import { startOfMonth, endOfMonth } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getEventsForMonth } from '@/lib/supabase/queries/events'
import { upsertRsvp, deleteRsvp, getRsvpsForEvent } from '@/lib/supabase/queries/event-rsvps'
import { rsvpSchema } from '@/lib/validations/rsvp'
import type { Event, EventRsvp, EventRsvpWithMember } from '@/lib/supabase/types'

export async function fetchEventsForMonthAction(
  monthIso: string,
): Promise<{ data?: Event[]; error?: string }> {
  try {
    const month = new Date(monthIso)
    const data = await getEventsForMonth(month)
    return { data }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to load events.' }
  }
}

export async function setRsvpAction(
  eventId: string,
  status: 'going' | 'not_going' | null,
): Promise<{ error?: string }> {
  try {
    const parsed = rsvpSchema.safeParse({ event_id: eventId, status: status ?? 'going' })
    if (status !== null && !parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    if (status === null) {
      await deleteRsvp(eventId, user.id)
    } else {
      await upsertRsvp(eventId, user.id, status)
    }

    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update RSVP.' }
  }
}

export async function getEventAttendeesAction(
  eventId: string,
): Promise<{ data?: EventRsvpWithMember[]; error?: string }> {
  try {
    const data = await getRsvpsForEvent(eventId)
    return { data }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to load attendees.' }
  }
}
