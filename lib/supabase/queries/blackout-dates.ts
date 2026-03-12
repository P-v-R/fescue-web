import { createClient } from '../server'
import { createAdminClient } from '../admin'

export type BlackoutDate = {
  id: string
  date: string      // 'YYYY-MM-DD'
  reason: string | null
  created_at: string
}

// Admin — all blackout dates, ordered ascending
export async function getBlackoutDates(): Promise<BlackoutDate[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blackout_dates')
    .select('id, date, reason, created_at')
    .order('date', { ascending: true })

  if (error) throw new Error(`getBlackoutDates: ${error.message}`)
  return (data ?? []) as BlackoutDate[]
}

// Member-facing — upcoming blackout dates only (for reservations page)
export async function getUpcomingBlackoutDates(): Promise<BlackoutDate[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('blackout_dates')
    .select('id, date, reason')
    .gte('date', today)
    .order('date', { ascending: true })

  if (error) throw new Error(`getUpcomingBlackoutDates: ${error.message}`)
  return (data ?? []) as BlackoutDate[]
}

export async function createBlackoutDate(
  date: string,
  reason: string | null,
  createdBy: string,
): Promise<BlackoutDate> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blackout_dates')
    .insert({ date, reason: reason || null, created_by: createdBy })
    .select()
    .single()

  if (error) throw new Error(`createBlackoutDate: ${error.message}`)
  return data as BlackoutDate
}

export async function deleteBlackoutDate(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('blackout_dates')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`deleteBlackoutDate: ${error.message}`)
}
