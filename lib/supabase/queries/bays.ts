import { createClient } from '../server'
import type { Bay } from '../types'

export async function getActiveBays(): Promise<Bay[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bays')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(`getActiveBays: ${error.message}`)
  return (data ?? []) as Bay[]
}
