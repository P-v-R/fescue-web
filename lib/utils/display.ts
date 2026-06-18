import { addMinutes, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns'
import { OPEN_HOUR, CLOSE_HOUR, SLOT_MINUTES } from './time-slots'

export const WINDOW_HOURS = 4

/**
 * Returns up to WINDOW_HOURS × 2 half-hour slots starting at the current
 * hour (or OPEN_HOUR if before opening), clamped to CLOSE_HOUR.
 */
export function getWindowSlots(now: Date): Date[] {
  const startHour = Math.max(now.getHours(), OPEN_HOUR)
  const closeTime = setMilliseconds(
    setSeconds(setMinutes(setHours(new Date(now), CLOSE_HOUR), 0), 0),
    0,
  )
  const start = setMilliseconds(
    setSeconds(setMinutes(setHours(new Date(now), startHour), 0), 0),
    0,
  )
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
export function interleaveItems<A, B>(as: A[], bs: B[]): (A | B)[] {
  const result: (A | B)[] = []
  const maxLen = Math.max(as.length, bs.length)
  for (let i = 0; i < maxLen; i++) {
    const a = as[i]
    const b = bs[i]
    if (a !== undefined) result.push(a)
    if (b !== undefined) result.push(b)
  }
  return result
}
