import { startOfMonth, endOfMonth } from 'date-fns'
import { createClient } from '../server'
import { createAdminClient } from '../admin'
import type { Event } from '../types'

export type CreateEventInput = {
  title: string
  description?: string
  starts_at: string
  ends_at?: string
  location?: string
  image_url?: string
  rsvp_enabled: boolean
  created_by?: string
}

export type UpdateEventInput = Partial<Omit<CreateEventInput, 'created_by'>>

// Member-facing — single event by ID
export async function getEventById(id: string): Promise<Event | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single()
  if (error) return null
  return data as Event
}

// Member-facing — events for a given calendar month
export async function getEventsForMonth(month: Date): Promise<Event[]> {
  const supabase = await createClient()
  const start = startOfMonth(month).toISOString()
  const end = endOfMonth(month).toISOString()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('starts_at', start)
    .lte('starts_at', end)
    .order('starts_at', { ascending: true })

  if (error) throw new Error(`getEventsForMonth: ${error.message}`)
  return (data ?? []) as Event[]
}

// Member-facing — next 10 upcoming events from today (for dashboard sidebar)
export async function getAllUpcomingEvents(): Promise<Event[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(10)

  if (error) throw new Error(`getAllUpcomingEvents: ${error.message}`)
  return (data ?? []) as Event[]
}

// Admin — all events ordered by most recent first
export async function getAdminEvents(): Promise<Event[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('starts_at', { ascending: false })

  if (error) throw new Error(`getAdminEvents: ${error.message}`)
  return (data ?? []) as Event[]
}

// Admin — create a new event
export async function createEvent(data: CreateEventInput): Promise<Event> {
  const supabase = createAdminClient()

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      title: data.title,
      description: data.description || null,
      starts_at: data.starts_at,
      ends_at: data.ends_at || null,
      location: data.location || null,
      image_url: data.image_url || null,
      rsvp_enabled: data.rsvp_enabled,
      created_by: data.created_by || null,
    })
    .select()
    .single()

  if (error) throw new Error(`createEvent: ${error.message}`)
  return event as Event
}

// Admin — update an event
export async function updateEvent(id: string, data: UpdateEventInput): Promise<Event> {
  const supabase = createAdminClient()

  const patch: Record<string, unknown> = {}
  if (data.title !== undefined) patch.title = data.title
  if (data.description !== undefined) patch.description = data.description || null
  if (data.starts_at !== undefined) patch.starts_at = data.starts_at
  if (data.ends_at !== undefined) patch.ends_at = data.ends_at || null
  if (data.location !== undefined) patch.location = data.location || null
  if (data.image_url !== undefined) patch.image_url = data.image_url || null
  if (data.rsvp_enabled !== undefined) patch.rsvp_enabled = data.rsvp_enabled

  const { data: event, error } = await supabase
    .from('events')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateEvent: ${error.message}`)
  return event as Event
}

// Admin — delete an event (cascades to event_rsvps)
export async function deleteEvent(id: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw new Error(`deleteEvent: ${error.message}`)
}
