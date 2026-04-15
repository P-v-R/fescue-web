import { describe, it, expect } from 'vitest'
import {
  generateTimeSlots,
  durationToSpan,
  timeToSlotIndex,
  isWithinOperatingHours,
  formatSlot,
  formatSlotShort,
  OPEN_HOUR,
  CLOSE_HOUR,
  SLOT_MINUTES,
} from '@/lib/utils/time-slots'

const date = new Date(2026, 2, 26) // March 26 2026

describe('generateTimeSlots', () => {
  it('starts at OPEN_HOUR (8am)', () => {
    const slots = generateTimeSlots(date)
    expect(slots[0].getHours()).toBe(OPEN_HOUR)
    expect(slots[0].getMinutes()).toBe(0)
  })

  it('ends before CLOSE_HOUR (last slot at 9:30pm)', () => {
    const slots = generateTimeSlots(date)
    const last = slots[slots.length - 1]
    expect(last.getHours()).toBe(CLOSE_HOUR - 1)
    expect(last.getMinutes()).toBe(30)
  })

  it('produces the correct number of slots (28 for 8am–10pm in 30min increments)', () => {
    const slots = generateTimeSlots(date)
    const expected = ((CLOSE_HOUR - OPEN_HOUR) * 60) / SLOT_MINUTES
    expect(slots).toHaveLength(expected)
  })

  it('slots are spaced exactly 30 minutes apart', () => {
    const slots = generateTimeSlots(date)
    for (let i = 1; i < slots.length; i++) {
      const diff = (slots[i].getTime() - slots[i - 1].getTime()) / 60000
      expect(diff).toBe(SLOT_MINUTES)
    }
  })

  it('slots all share the same date as the input', () => {
    const slots = generateTimeSlots(date)
    for (const slot of slots) {
      expect(slot.getFullYear()).toBe(date.getFullYear())
      expect(slot.getMonth()).toBe(date.getMonth())
      expect(slot.getDate()).toBe(date.getDate())
    }
  })

  it('resets seconds and milliseconds to zero', () => {
    const slots = generateTimeSlots(date)
    for (const slot of slots) {
      expect(slot.getSeconds()).toBe(0)
      expect(slot.getMilliseconds()).toBe(0)
    }
  })
})

describe('durationToSpan', () => {
  it('30 minutes = 1 slot', () => expect(durationToSpan(30)).toBe(1))
  it('60 minutes = 2 slots', () => expect(durationToSpan(60)).toBe(2))
  it('90 minutes = 3 slots', () => expect(durationToSpan(90)).toBe(3))
  it('120 minutes = 4 slots', () => expect(durationToSpan(120)).toBe(4))
})

describe('timeToSlotIndex', () => {
  it('8:00am maps to index 0', () => {
    const t = new Date(2026, 2, 26, 8, 0)
    expect(timeToSlotIndex(t)).toBe(0)
  })

  it('8:30am maps to index 1', () => {
    const t = new Date(2026, 2, 26, 8, 30)
    expect(timeToSlotIndex(t)).toBe(1)
  })

  it('9:00am maps to index 2', () => {
    const t = new Date(2026, 2, 26, 9, 0)
    expect(timeToSlotIndex(t)).toBe(2)
  })

  it('12:00pm maps to index 8', () => {
    const t = new Date(2026, 2, 26, 12, 0)
    expect(timeToSlotIndex(t)).toBe(8)
  })

  it('9:30pm (last slot) maps to index 27', () => {
    const t = new Date(2026, 2, 26, 21, 30)
    expect(timeToSlotIndex(t)).toBe(27)
  })

  it('slot index round-trips with generateTimeSlots', () => {
    const slots = generateTimeSlots(date)
    slots.forEach((slot, i) => {
      expect(timeToSlotIndex(slot)).toBe(i)
    })
  })
})

describe('isWithinOperatingHours', () => {
  it('8:00am + 60min is within hours', () => {
    const start = new Date(2026, 2, 26, 8, 0)
    expect(isWithinOperatingHours(start, 60)).toBe(true)
  })

  it('9:30pm + 30min ends exactly at close — within hours', () => {
    const start = new Date(2026, 2, 26, 21, 30)
    expect(isWithinOperatingHours(start, 30)).toBe(true)
  })

  it('9:30pm + 60min overruns close — not within hours', () => {
    const start = new Date(2026, 2, 26, 21, 30)
    expect(isWithinOperatingHours(start, 60)).toBe(false)
  })

  it('9:00pm + 120min overruns close — not within hours', () => {
    const start = new Date(2026, 2, 26, 21, 0)
    expect(isWithinOperatingHours(start, 120)).toBe(false)
  })

  it('all standard durations from 8am are within hours', () => {
    const start = new Date(2026, 2, 26, 8, 0)
    for (const dur of [30, 60, 90, 120]) {
      expect(isWithinOperatingHours(start, dur)).toBe(true)
    }
  })
})

describe('formatSlot', () => {
  it('formats 8:00am correctly', () => {
    expect(formatSlot(new Date(2026, 2, 26, 8, 0))).toBe('8:00 AM')
  })

  it('formats 12:00pm correctly', () => {
    expect(formatSlot(new Date(2026, 2, 26, 12, 0))).toBe('12:00 PM')
  })

  it('formats 9:30pm correctly', () => {
    expect(formatSlot(new Date(2026, 2, 26, 21, 30))).toBe('9:30 PM')
  })
})

describe('formatSlotShort', () => {
  it('formats 8:00am as "8:00am"', () => {
    expect(formatSlotShort(new Date(2026, 2, 26, 8, 0))).toBe('8:00am')
  })

  it('formats 12:30pm as "12:30pm"', () => {
    expect(formatSlotShort(new Date(2026, 2, 26, 12, 30))).toBe('12:30pm')
  })

  it('is always lowercase', () => {
    const result = formatSlotShort(new Date(2026, 2, 26, 15, 0))
    expect(result).toBe(result.toLowerCase())
  })
})
