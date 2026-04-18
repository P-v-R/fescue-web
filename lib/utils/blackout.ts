// Shared type + helper — safe to import in both server and client modules.
// Server-only queries (createClient, etc.) live in lib/supabase/queries/blackout-periods.ts

export type BlackoutPeriod = {
  id: string
  date: string           // 'YYYY-MM-DD'
  start_time: string | null  // 'HH:MM:SS' — null means all day
  end_time: string | null    // 'HH:MM:SS' — null means all day
  all_bays: boolean
  bay_ids: string[]
  reason: string | null
  created_at: string
}

// Returns the matching period if this bay+time is blacked out, otherwise null.
export function findBlackout(
  slotTime: Date,
  bayId: string,
  periods: BlackoutPeriod[],
): BlackoutPeriod | null {
  const slotHHMM = `${String(slotTime.getHours()).padStart(2, '0')}:${String(slotTime.getMinutes()).padStart(2, '0')}`

  const slotDate = [
    slotTime.getFullYear(),
    String(slotTime.getMonth() + 1).padStart(2, '0'),
    String(slotTime.getDate()).padStart(2, '0'),
  ].join('-')

  return (
    periods.find((p) => {
      if (p.date !== slotDate) return false
      const bayMatch = p.all_bays || p.bay_ids.includes(bayId)
      if (!bayMatch) return false
      if (!p.start_time || !p.end_time) return true // all day
      const start = p.start_time.slice(0, 5)
      const end = p.end_time.slice(0, 5)
      return slotHHMM >= start && slotHHMM < end
    }) ?? null
  )
}
