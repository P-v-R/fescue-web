// Shared type + helper — safe to import in both server and client modules.
// Server-only queries (createClient, etc.) live in lib/supabase/queries/blackout-periods.ts

import { clubDateKey, clubTimeKey } from './club-time'
import { SLOT_MINUTES } from './time-slots'

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
// Periods are stored as club-local (Pacific) date + wall-clock times, so the
// slot is converted to club time explicitly — this runs on UTC servers too.
export function findBlackout(
  slotTime: Date,
  bayId: string,
  periods: BlackoutPeriod[],
): BlackoutPeriod | null {
  const slotDate = clubDateKey(slotTime)
  const slotHHMM = clubTimeKey(slotTime)

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

// Returns the first blackout that any 30-minute slot of the booking falls
// into — so a 4pm two-hour booking can't run into a 5pm blackout.
export function findBlackoutInRange(
  startTime: Date,
  durationMinutes: number,
  bayId: string,
  periods: BlackoutPeriod[],
): BlackoutPeriod | null {
  for (let offset = 0; offset < durationMinutes; offset += SLOT_MINUTES) {
    const slot = new Date(startTime.getTime() + offset * 60_000)
    const blackout = findBlackout(slot, bayId, periods)
    if (blackout) return blackout
  }
  return null
}
