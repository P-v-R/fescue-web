import { createClient } from '../server'
import { createAdminClient } from '../admin'
export type { BlackoutPeriod } from '@/lib/utils/blackout'
export { findBlackout } from '@/lib/utils/blackout'
import type { BlackoutPeriod } from '@/lib/utils/blackout'

// Admin — all periods, ordered by date then start_time
export async function getBlackoutPeriods(): Promise<BlackoutPeriod[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blackout_periods')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: true })

  if (error) throw new Error(`getBlackoutPeriods: ${error.message}`)
  return (data ?? []) as BlackoutPeriod[]
}

// Member-facing — upcoming periods from today forward
export async function getUpcomingBlackoutPeriods(): Promise<BlackoutPeriod[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('blackout_periods')
    .select('*')
    .gte('date', today)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: true })

  if (error) throw new Error(`getUpcomingBlackoutPeriods: ${error.message}`)
  return (data ?? []) as BlackoutPeriod[]
}

export async function createBlackoutPeriod(input: {
  date: string
  start_time: string | null
  end_time: string | null
  all_bays: boolean
  bay_ids: string[]
  reason: string | null
  created_by: string
}): Promise<BlackoutPeriod> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blackout_periods')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(`createBlackoutPeriod: ${error.message}`)
  return data as BlackoutPeriod
}

export async function deleteBlackoutPeriod(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('blackout_periods')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`deleteBlackoutPeriod: ${error.message}`)
}

