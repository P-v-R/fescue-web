import { describe, it, expect } from 'vitest'
import {
  getWindowSlots,
  formatTimeLabel,
  interleaveItems,
  WINDOW_HOURS,
} from '@/lib/utils/display'
import { OPEN_HOUR, CLOSE_HOUR, SLOT_MINUTES } from '@/lib/utils/time-slots'

// ─── getWindowSlots ──────────────────────────────────────────────────────────

describe('getWindowSlots', () => {
  it('returns 8 slots (4 hours × 2) for a midday time', () => {
    const now = new Date(2026, 5, 18, 10, 15)
    expect(getWindowSlots(now)).toHaveLength(WINDOW_HOURS * 2)
  })

  it('starts at the current hour, ignoring minutes', () => {
    const now = new Date(2026, 5, 18, 10, 45)
    const slots = getWindowSlots(now)
    expect(slots[0].getHours()).toBe(10)
    expect(slots[0].getMinutes()).toBe(0)
  })

  it('starts at OPEN_HOUR when called before opening time', () => {
    const now = new Date(2026, 5, 18, 5, 30) // 5:30 AM
    const slots = getWindowSlots(now)
    expect(slots[0].getHours()).toBe(OPEN_HOUR)
    expect(slots[0].getMinutes()).toBe(0)
  })

  it('slots are exactly SLOT_MINUTES apart', () => {
    const slots = getWindowSlots(new Date(2026, 5, 18, 10, 0))
    for (let i = 1; i < slots.length; i++) {
      const diff = (slots[i].getTime() - slots[i - 1].getTime()) / 60_000
      expect(diff).toBe(SLOT_MINUTES)
    }
  })

  it('first slot of each pair is on the hour', () => {
    const slots = getWindowSlots(new Date(2026, 5, 18, 10, 0))
    expect(slots[0].getMinutes()).toBe(0)
    expect(slots[2].getMinutes()).toBe(0)
    expect(slots[4].getMinutes()).toBe(0)
  })

  it('second slot of each pair is on the half-hour', () => {
    const slots = getWindowSlots(new Date(2026, 5, 18, 10, 0))
    expect(slots[1].getMinutes()).toBe(30)
    expect(slots[3].getMinutes()).toBe(30)
  })

  it('clamps window end to CLOSE_HOUR — no slot starts at or after close', () => {
    const now = new Date(2026, 5, 18, 20, 0) // 8 PM
    const slots = getWindowSlots(now)
    const closeMs = new Date(2026, 5, 18, CLOSE_HOUR, 0).getTime()
    for (const s of slots) {
      expect(s.getTime()).toBeLessThan(closeMs)
    }
  })

  it('returns fewer than 8 slots when near close time', () => {
    // 8 PM to 10 PM close = 4 slots, not the full 8
    expect(getWindowSlots(new Date(2026, 5, 18, 20, 0)).length).toBeLessThan(WINDOW_HOURS * 2)
  })

  it('returns empty array at CLOSE_HOUR', () => {
    expect(getWindowSlots(new Date(2026, 5, 18, CLOSE_HOUR, 0))).toHaveLength(0)
  })

  it('returns empty array after CLOSE_HOUR', () => {
    expect(getWindowSlots(new Date(2026, 5, 18, 23, 0))).toHaveLength(0)
  })

  it('all slots share the same calendar date as now', () => {
    const slots = getWindowSlots(new Date(2026, 5, 18, 10, 0))
    for (const s of slots) {
      expect(s.getFullYear()).toBe(2026)
      expect(s.getMonth()).toBe(5)
      expect(s.getDate()).toBe(18)
    }
  })

  it('zeroes out seconds and milliseconds on all slots', () => {
    const slots = getWindowSlots(new Date(2026, 5, 18, 10, 45, 59, 999))
    for (const s of slots) {
      expect(s.getSeconds()).toBe(0)
      expect(s.getMilliseconds()).toBe(0)
    }
  })

  it('window starting exactly at OPEN_HOUR returns full 8-slot window', () => {
    const slots = getWindowSlots(new Date(2026, 5, 18, OPEN_HOUR, 0))
    expect(slots).toHaveLength(WINDOW_HOURS * 2)
    expect(slots[0].getHours()).toBe(OPEN_HOUR)
  })
})

// ─── formatTimeLabel ─────────────────────────────────────────────────────────

describe('formatTimeLabel', () => {
  it('formats an AM hour mark as "H:00 AM"', () => {
    expect(formatTimeLabel(new Date(2026, 5, 18, 8, 0))).toBe('8:00 AM')
    expect(formatTimeLabel(new Date(2026, 5, 18, 11, 0))).toBe('11:00 AM')
  })

  it('formats a PM hour mark as "H:00 PM"', () => {
    expect(formatTimeLabel(new Date(2026, 5, 18, 13, 0))).toBe('1:00 PM')
    expect(formatTimeLabel(new Date(2026, 5, 18, 21, 0))).toBe('9:00 PM')
  })

  it('formats a half-hour mark without AM/PM', () => {
    expect(formatTimeLabel(new Date(2026, 5, 18, 8, 30))).toBe('8:30')
    expect(formatTimeLabel(new Date(2026, 5, 18, 13, 30))).toBe('1:30')
    expect(formatTimeLabel(new Date(2026, 5, 18, 21, 30))).toBe('9:30')
  })

  it('handles noon as "12:00 PM"', () => {
    expect(formatTimeLabel(new Date(2026, 5, 18, 12, 0))).toBe('12:00 PM')
  })

  it('handles midnight as "12:00 AM"', () => {
    expect(formatTimeLabel(new Date(2026, 5, 18, 0, 0))).toBe('12:00 AM')
  })

  it('half-hour labels never include AM or PM', () => {
    const times = [
      new Date(2026, 5, 18, 8, 30),
      new Date(2026, 5, 18, 12, 30),
      new Date(2026, 5, 18, 21, 30),
    ]
    for (const t of times) {
      expect(formatTimeLabel(t)).not.toMatch(/AM|PM/)
    }
  })

  it('hour labels always include AM or PM', () => {
    const times = [
      new Date(2026, 5, 18, 8, 0),
      new Date(2026, 5, 18, 12, 0),
      new Date(2026, 5, 18, 21, 0),
    ]
    for (const t of times) {
      expect(formatTimeLabel(t)).toMatch(/AM|PM/)
    }
  })
})

// ─── interleaveItems ─────────────────────────────────────────────────────────

describe('interleaveItems', () => {
  it('interleaves equal-length arrays [a0, b0, a1, b1]', () => {
    expect(interleaveItems(['p1', 'p2'], ['e1', 'e2'])).toEqual([
      'p1', 'e1', 'p2', 'e2',
    ])
  })

  it('appends excess posts when posts outnumber events', () => {
    expect(interleaveItems(['p1', 'p2', 'p3'], ['e1'])).toEqual([
      'p1', 'e1', 'p2', 'p3',
    ])
  })

  it('appends excess events when events outnumber posts', () => {
    expect(interleaveItems(['p1'], ['e1', 'e2', 'e3'])).toEqual([
      'p1', 'e1', 'e2', 'e3',
    ])
  })

  it('returns just the posts array when events is empty', () => {
    expect(interleaveItems(['p1', 'p2'], [])).toEqual(['p1', 'p2'])
  })

  it('returns just the events array when posts is empty', () => {
    expect(interleaveItems([], ['e1', 'e2'])).toEqual(['e1', 'e2'])
  })

  it('returns empty array when both inputs are empty', () => {
    expect(interleaveItems([], [])).toEqual([])
  })

  it('result length equals the sum of both input lengths', () => {
    expect(interleaveItems(['p1', 'p2', 'p3'], ['e1', 'e2'])).toHaveLength(5)
  })

  it('each post appears before its paired event', () => {
    const result = interleaveItems(['p1', 'p2'], ['e1', 'e2'])
    expect(result.indexOf('p1')).toBeLessThan(result.indexOf('e1'))
    expect(result.indexOf('p2')).toBeLessThan(result.indexOf('e2'))
  })

  it('preserves the original order within each input', () => {
    const result = interleaveItems(['p1', 'p2', 'p3'], ['e1', 'e2', 'e3'])
    const posts = result.filter((x) => x.startsWith('p'))
    const events = result.filter((x) => x.startsWith('e'))
    expect(posts).toEqual(['p1', 'p2', 'p3'])
    expect(events).toEqual(['e1', 'e2', 'e3'])
  })
})
