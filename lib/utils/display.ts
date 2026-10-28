import { addMinutes, set } from 'date-fns'
import { OPEN_HOUR, CLOSE_HOUR, SLOT_MINUTES } from './time-slots'
import { findBlackout, type BlackoutPeriod } from './blackout'

export const WINDOW_HOURS = 4

/**
 * Returns up to WINDOW_HOURS × 2 half-hour slots starting at the current
 * hour (or OPEN_HOUR if before opening), clamped to CLOSE_HOUR.
 */
export function getWindowSlots(now: Date): Date[] {
  const startHour = Math.max(now.getHours(), OPEN_HOUR)
  const closeTime = set(now, { hours: CLOSE_HOUR, minutes: 0, seconds: 0, milliseconds: 0 })
  const start = set(now, { hours: startHour, minutes: 0, seconds: 0, milliseconds: 0 })
  const windowEnd = addMinutes(start, WINDOW_HOURS * 60)
  const end = windowEnd < closeTime ? windowEnd : closeTime

  const slots: Date[] = []
  let current = new Date(start)
  while (current < end) {
    slots.push(new Date(current))
    current = addMinutes(current, SLOT_MINUTES)
  }
  return slots
}

/**
 * Formats a slot time as "8:00 AM" for hour marks and "8:30" (no AM/PM) for
 * half-hour marks — matches the kiosk grid time column style.
 */
export function formatTimeLabel(date: Date): string {
  const h = date.getHours()
  const m = date.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}:00 ${ampm}` : `${h12}:30`
}

/**
 * Interleaves two arrays element-by-element: [a0, b0, a1, b1, …].
 * If arrays have unequal lengths, excess items are appended at the end.
 */
export function interleaveItems<T>(as: T[], bs: T[]): T[] {
  const result: T[] = []
  const maxLen = Math.max(as.length, bs.length)
  for (let i = 0; i < maxLen; i++) {
    const a = as[i]
    const b = bs[i]
    if (a !== undefined) result.push(a)
    if (b !== undefined) result.push(b)
  }
  return result
}

export type BlackoutRun = {
  period: BlackoutPeriod
  /** Number of consecutive visible slots this blackout covers */
  span: number
}

/**
 * Groups consecutive blacked-out slots for each bay into runs so the kiosk can
 * render one merged cell per blackout. Keys are `${slotIdx}-${bayIdx}` (the
 * run's first slot), matching the kiosk's booking cell keys. Slots in
 * `occupied` (already showing a booking) break a run and are never covered.
 */
export function getBlackoutRuns(
  slots: Date[],
  bayIds: string[],
  periods: BlackoutPeriod[],
  occupied: Set<string>,
): { runs: Map<string, BlackoutRun>; continuations: Set<string> } {
  const runs = new Map<string, BlackoutRun>()
  const continuations = new Set<string>()
  if (periods.length === 0) return { runs, continuations }

  bayIds.forEach((bayId, bayIdx) => {
    let runStartKey: string | null = null
    let runPeriodId: string | null = null

    slots.forEach((slot, slotIdx) => {
      const key = `${slotIdx}-${bayIdx}`
      const period = occupied.has(key) ? null : findBlackout(slot, bayId, periods)

      if (!period) {
        runStartKey = null
        runPeriodId = null
        return
      }

      const run = runStartKey ? runs.get(runStartKey) : undefined
      if (run && runPeriodId === period.id) {
        run.span++
        continuations.add(key)
      } else {
        runs.set(key, { period, span: 1 })
        runStartKey = key
        runPeriodId = period.id
      }
    })
  })

  return { runs, continuations }
}
