import { addMinutes, format, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns'

export const OPEN_HOUR = 8    // 8am
export const CLOSE_HOUR = 22  // 10pm
export const SLOT_MINUTES = 30

// Returns the 28 half-hour slot start times for a given date (8:00am–9:30pm)
export function generateTimeSlots(date: Date): Date[] {
  const slots: Date[] = []
  let current = setMilliseconds(setSeconds(setMinutes(setHours(new Date(date), OPEN_HOUR), 0), 0), 0)
  const end = setMilliseconds(setSeconds(setMinutes(setHours(new Date(date), CLOSE_HOUR), 0), 0), 0)

  while (current < end) {
    slots.push(new Date(current))
    current = addMinutes(current, SLOT_MINUTES)
  }
  return slots
}

// How many grid rows a booking duration spans
export function durationToSpan(durationMinutes: number): number {
  return durationMinutes / SLOT_MINUTES
}

// Slot index from a booking start time (relative to OPEN_HOUR)
export function timeToSlotIndex(time: Date): number {
  const minutesSinceOpen = (time.getHours() - OPEN_HOUR) * 60 + time.getMinutes()
  return Math.round(minutesSinceOpen / SLOT_MINUTES)
}

// Whether startTime + duration fits within operating hours
export function isWithinOperatingHours(startTime: Date, durationMinutes: number): boolean {
  const endTime = addMinutes(startTime, durationMinutes)
  const closeTime = setMilliseconds(
    setSeconds(setMinutes(setHours(new Date(startTime), CLOSE_HOUR), 0), 0),
    0,
  )
  return endTime <= closeTime
}

export function formatSlot(date: Date): string {
  return format(date, 'h:mm a')
}

export function formatSlotShort(date: Date): string {
  return format(date, 'h:mma').toLowerCase()
}
