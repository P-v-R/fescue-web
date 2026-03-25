import { createClient } from '../server'
import { createAdminClient } from '../admin'
import type { EventRsvp, EventRsvpWithMember } from '../types'

// Member — get own RSVPs for a list of event IDs (used for calendar pre-fetch)
export async function getMemberRsvpsForEvents(
  memberId: string,
  eventIds: string[],
): Promise<EventRsvp[]> {
  if (eventIds.length === 0) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('member_id', memberId)
    .in('event_id', eventIds)

  if (error) throw new Error(`getMemberRsvpsForEvents: ${error.message}`)
  return (data ?? []) as EventRsvp[]
}

// Member + Admin — all RSVPs for a single event with member names
export async function getRsvpsForEvent(eventId: string): Promise<EventRsvpWithMember[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_rsvps')
    .select('*, members(full_name, email)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getRsvpsForEvent: ${error.message}`)
  return (data ?? []) as EventRsvpWithMember[]
}

// Admin — RSVPs for multiple events at once (for admin panel)
export async function getAdminRsvpsForEvents(
  eventIds: string[],
): Promise<EventRsvpWithMember[]> {
  if (eventIds.length === 0) return []

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('event_rsvps')
    .select('*, members(full_name, email)')
    .in('event_id', eventIds)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getAdminRsvpsForEvents: ${error.message}`)
  return (data ?? []) as EventRsvpWithMember[]
}

// Member — upsert own RSVP (insert or update existing)
export async function upsertRsvp(
  eventId: string,
  memberId: string,
  status: 'going' | 'not_going',
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('event_rsvps')
    .upsert({ event_id: eventId, member_id: memberId, status }, { onConflict: 'event_id,member_id' })

  if (error) throw new Error(`upsertRsvp: ${error.message}`)
}

// Member — remove own RSVP
export async function deleteRsvp(eventId: string, memberId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('member_id', memberId)

  if (error) throw new Error(`deleteRsvp: ${error.message}`)
}

// Admin — remove any member's RSVP
export async function deleteRsvpAdmin(eventId: string, memberId: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('member_id', memberId)

  if (error) throw new Error(`deleteRsvpAdmin: ${error.message}`)
}
