import { startOfDay, endOfDay } from 'date-fns'
import { createAdminClient } from '../admin'
import type { Bay, BookingWithMember, Event } from '../types'

// Display page — uses admin client, no auth required.

export async function getDisplayActiveBays(): Promise<Bay[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('bays')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(`getDisplayActiveBays: ${error.message}`)
  return (data ?? []) as Bay[]
}

export async function getDisplayBookingsForToday(): Promise<BookingWithMember[]> {
  const supabase = createAdminClient()
  const now = new Date()

  const { data, error } = await supabase
    .from('bookings')
    .select('id, bay_id, start_time, end_time, members(full_name)')
    .gte('start_time', startOfDay(now).toISOString())
    .lte('start_time', endOfDay(now).toISOString())
    .is('cancelled_at', null)
    .order('start_time', { ascending: true })

  if (error) throw new Error(`getDisplayBookingsForToday: ${error.message}`)
  return (data ?? []) as unknown as BookingWithMember[]
}

export async function getDisplayUpcomingEvents(): Promise<Event[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(10)

  if (error) throw new Error(`getDisplayUpcomingEvents: ${error.message}`)
  return (data ?? []) as Event[]
}
