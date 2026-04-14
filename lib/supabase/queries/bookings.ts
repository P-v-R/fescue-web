import { startOfDay, endOfDay, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { createClient } from '../server'
import { createAdminClient } from '../admin'
import type { Booking, BookingWithMember, NewBooking } from '../types'

export type AdminBooking = Booking & {
  members: { full_name: string; email: string } | null
  bays: { name: string } | null
}

// Admin only — today's bookings across all bays, with member and bay names.
export async function getAdminBookingsForToday(): Promise<AdminBooking[]> {
  const supabase = createAdminClient()
  const now = new Date()

  const { data, error } = await supabase
    .from('bookings')
    .select('*, members(full_name, email), bays(name)')
    .gte('start_time', startOfDay(now).toISOString())
    .lte('start_time', endOfDay(now).toISOString())
    .is('cancelled_at', null)
    .order('start_time', { ascending: true })

  if (error) throw new Error(`getAdminBookingsForToday: ${error.message}`)
  return (data ?? []) as AdminBooking[]
}

// Admin only — bookings for any given date.
export async function getAdminBookingsForDate(date: Date): Promise<AdminBooking[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('*, members(full_name, email), bays(name)')
    .gte('start_time', startOfDay(date).toISOString())
    .lte('start_time', endOfDay(date).toISOString())
    .is('cancelled_at', null)
    .order('start_time', { ascending: true })

  if (error) throw new Error(`getAdminBookingsForDate: ${error.message}`)
  return (data ?? []) as AdminBooking[]
}

// Admin only — cancel any booking (not just own).
export async function cancelBookingAdmin(id: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('bookings')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`cancelBookingAdmin: ${error.message}`)
}

// Admin only — count of non-cancelled bookings this calendar week.
export async function getBookingsThisWeek(): Promise<number> {
  const supabase = createAdminClient()
  const now = new Date()

  const { count, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .gte('start_time', startOfWeek(now, { weekStartsOn: 1 }).toISOString())
    .lte('start_time', endOfWeek(now, { weekStartsOn: 1 }).toISOString())
    .is('cancelled_at', null)

  if (error) throw new Error(`getBookingsThisWeek: ${error.message}`)
  return count ?? 0
}

// Admin only — full booking history for a specific member.
export async function getAdminMemberBookings(memberId: string): Promise<AdminBooking[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('*, members(full_name, email), bays(name)')
    .eq('member_id', memberId)
    .order('start_time', { ascending: false })

  if (error) throw new Error(`getAdminMemberBookings: ${error.message}`)
  return (data ?? []) as AdminBooking[]
}

// Admin only — create a booking on behalf of any member (bypasses RLS).
export async function createBookingAdmin(data: NewBooking): Promise<Booking> {
  const supabase = createAdminClient()

  const startIso = data.start_time
  const durationMs = data.duration_minutes * 60 * 1000
  const endIso = new Date(new Date(startIso).getTime() + durationMs).toISOString()

  const { data: conflicts, error: checkError } = await supabase
    .from('bookings')
    .select('id')
    .eq('bay_id', data.bay_id)
    .is('cancelled_at', null)
    .lt('start_time', endIso)
    .gt('end_time', startIso)

  if (checkError) throw new Error(`createBookingAdmin overlap check: ${checkError.message}`)
  if (conflicts && conflicts.length > 0) {
    throw new Error('That bay is already booked for the selected time. Please choose another slot.')
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      member_id: data.member_id,
      bay_id: data.bay_id,
      start_time: data.start_time,
      end_time: endIso,
      duration_minutes: data.duration_minutes,
      guests: data.guests ?? [],
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23P01') {
      throw new Error('That bay is already booked for the selected time. Please choose another slot.')
    }
    throw new Error(`createBookingAdmin: ${error.message}`)
  }

  return booking as Booking
}

// All bookings for a given date (across all bays), for the availability grid.
// Includes non-cancelled bookings only. Joins member name for display in the grid.
export async function getBookingsForDate(date: Date): Promise<BookingWithMember[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('*, members(full_name)')
    .gte('start_time', startOfDay(date).toISOString())
    .lte('start_time', endOfDay(date).toISOString())
    .is('cancelled_at', null)
    .order('start_time', { ascending: true })

  if (error) throw new Error(`getBookingsForDate: ${error.message}`)
  return (data ?? []) as BookingWithMember[]
}

// Create a booking. Does an explicit overlap check first for a friendly error,
// then relies on the DB GiST constraint as the final guard.
export async function createBooking(data: NewBooking): Promise<Booking> {
  const supabase = await createClient()

  // Explicit server-side overlap check before insert
  const startIso = data.start_time
  const durationMs = data.duration_minutes * 60 * 1000
  const endIso = new Date(new Date(startIso).getTime() + durationMs).toISOString()

  const { data: conflicts, error: checkError } = await supabase
    .from('bookings')
    .select('id')
    .eq('bay_id', data.bay_id)
    .is('cancelled_at', null)
    .lt('start_time', endIso)
    .gt('end_time', startIso)

  if (checkError) throw new Error(`createBooking overlap check: ${checkError.message}`)
  if (conflicts && conflicts.length > 0) {
    throw new Error('That bay is already booked for the selected time. Please choose another slot.')
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      member_id: data.member_id,
      bay_id: data.bay_id,
      start_time: data.start_time,
      end_time: endIso,
      duration_minutes: data.duration_minutes,
      guests: data.guests ?? [],
    })
    .select()
    .single()

  if (error) {
    // GiST constraint violation
    if (error.code === '23P01') {
      throw new Error('That bay is already booked for the selected time. Please choose another slot.')
    }
    throw new Error(`createBooking: ${error.message}`)
  }

  return booking as Booking
}

export type GuestLead = {
  booking_id: string
  start_time: string
  guest_name: string
  guest_email: string
  member: { full_name: string; email: string } | null
}

// Admin only — all guests from bookings with at least one guest, newest first.
// Flattens the guests array so each guest is its own lead row.
export async function getGuestLeads(): Promise<GuestLead[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('id, guests, start_time, members(full_name, email)')
    .neq('guests', '[]')
    .order('start_time', { ascending: false })

  if (error) throw new Error(`getGuestLeads: ${error.message}`)

  return (data ?? []).flatMap((row) => {
    const guests = row.guests as { name: string; email: string }[]
    const member = Array.isArray(row.members) ? (row.members[0] ?? null) : (row.members ?? null)
    return guests.map((g) => ({
      booking_id: row.id,
      start_time: row.start_time,
      guest_name: g.name,
      guest_email: g.email,
      member,
    }))
  })
}

// Soft-cancel a booking by setting cancelled_at.
export async function cancelBooking(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('bookings')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`cancelBooking: ${error.message}`)
}

// A member's upcoming bookings within the next 7 days (for dashboard card).
export async function getUpcomingMemberBookings(memberId: string) {
  const supabase = await createClient()
  const now = new Date()

  const { data, error } = await supabase
    .from('bookings')
    .select('*, bays(name)')
    .eq('member_id', memberId)
    .is('cancelled_at', null)
    .gte('start_time', now.toISOString())
    .lte('start_time', addDays(now, 7).toISOString())
    .order('start_time', { ascending: true })

  if (error) throw new Error(`getUpcomingMemberBookings: ${error.message}`)
  return (data ?? []) as import('../types').BookingWithBay[]
}

// A member's own bookings, split into upcoming and past by the caller.
export async function getMemberBookings(memberId: string): Promise<Booking[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('*, bays(name)')
    .eq('member_id', memberId)
    .order('start_time', { ascending: false })

  if (error) throw new Error(`getMemberBookings: ${error.message}`)
  return (data ?? []) as Booking[]
}
