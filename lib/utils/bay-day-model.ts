// Pure view-model for the mobile all-bays timeline: which rows are visible,
// what fills each bay's column, and who is on each bay right now.

import { addMinutes, isBefore, isSameDay, set } from 'date-fns'
import {
  CLOSE_HOUR,
  durationToSpan,
  generateTimeSlots,
  timeToSlotIndex,
} from './time-slots'
import { findBlackout, type BlackoutPeriod } from './blackout'
import { formatMemberName } from './member-name'
import type { Bay, BookingWithMember } from '@/lib/supabase/types'

export type BayBlock =
  | {
      kind: 'booking'
      rowStart: number
      span: number
      booking: BookingWithMember
      mine: boolean
      shortName: string
      guestCount: number
      // Booking began in the folded "earlier" range and is drawn cut off at the top
      clippedStart: boolean
    }
  | { kind: 'blackout'; rowStart: number; span: number; reason: string | null }
  | { kind: 'open'; rowStart: number; span: 1; slotTime: Date }
  | { kind: 'past'; rowStart: number; span: 1; slotTime: Date }

export type BayNowStatus =
  | { kind: 'occupied'; shortName: string; guestCount: number; mine: boolean; until: Date }
  | { kind: 'blackout'; reason: string | null }
  | { kind: 'open'; until: Date | null }

export type BayDayModel = {
  rows: Date[]
  earlier: { from: Date; to: Date; bookingCount: number } | null
  closed: boolean
  nowMinutes: number | null
  columns: { bay: Bay; blocks: BayBlock[]; now: BayNowStatus | null }[]
}

type Input = {
  bays: Bay[]
  bookings: BookingWithMember[]
  blackoutPeriods: BlackoutPeriod[]
  date: Date
  userId: string
  now: Date
  includeEarlier: boolean
}

export function buildBayDayModel({
  bays,
  bookings,
  blackoutPeriods,
  date,
  userId,
  now,
  includeEarlier,
}: Input): BayDayModel {
  const slots = generateTimeSlots(date)
  const openTime = slots[0]
  const closeTime = set(date, { hours: CLOSE_HOUR, minutes: 0, seconds: 0, milliseconds: 0 })
  const isToday = isSameDay(date, now)
  const isOpenNow = isToday && !isBefore(now, openTime) && isBefore(now, closeTime)
  const closed = isToday && !isBefore(now, closeTime)

  // Rows before the current hour fold away on today's view
  let foldIndex = 0
  if (closed) foldIndex = slots.length
  else if (isOpenNow) foldIndex = slots.findIndex((s) => s.getHours() === now.getHours())

  const bayIds = new Set(bays.map((b) => b.id))
  const dayBookings = bookings.filter((b) => bayIds.has(b.bay_id))

  const earlier =
    foldIndex > 0
      ? {
          from: openTime,
          to: foldIndex < slots.length ? slots[foldIndex] : closeTime,
          bookingCount: dayBookings.filter((b) =>
            timeToSlotIndex(new Date(b.start_time)) < foldIndex,
          ).length,
        }
      : null

  const start = includeEarlier ? 0 : foldIndex
  const rows = slots.slice(start)

  const columns = bays.map((bay) => {
    const own = dayBookings.filter((b) => b.bay_id === bay.id)
    return {
      bay,
      blocks: buildBlocks(bay.id, own, slots, start, now, userId, blackoutPeriods),
      now: isOpenNow ? nowStatus(bay.id, own, now, userId, blackoutPeriods) : null,
    }
  })

  return {
    rows,
    earlier,
    closed,
    nowMinutes: isOpenNow && rows.length > 0
      ? Math.round((now.getTime() - rows[0].getTime()) / 60_000)
      : null,
    columns,
  }
}

function buildBlocks(
  bayId: string,
  bookings: BookingWithMember[],
  slots: Date[],
  start: number,
  now: Date,
  userId: string,
  blackoutPeriods: BlackoutPeriod[],
): BayBlock[] {
  const blocks: BayBlock[] = []
  const covered = new Set<number>()

  for (const booking of bookings) {
    const si = timeToSlotIndex(new Date(booking.start_time))
    const ei = Math.min(si + durationToSpan(booking.duration_minutes), slots.length)
    if (ei <= start || si >= slots.length) continue
    const visibleStart = Math.max(si, start)
    for (let i = visibleStart; i < ei; i++) covered.add(i)
    blocks.push({
      kind: 'booking',
      rowStart: visibleStart - start,
      span: ei - visibleStart,
      booking,
      mine: booking.member_id === userId,
      shortName: formatMemberName(booking.members?.full_name),
      guestCount: booking.guests?.length ?? 0,
      clippedStart: si < start,
    })
  }

  let openBlackout: Extract<BayBlock, { kind: 'blackout' }> | null = null
  let openBlackoutId: string | null = null

  for (let i = start; i < slots.length; i++) {
    if (covered.has(i)) {
      openBlackout = null
      continue
    }
    const slotTime = slots[i]
    const rowStart = i - start

    if (isBefore(slotTime, now)) {
      openBlackout = null
      blocks.push({ kind: 'past', rowStart, span: 1, slotTime })
      continue
    }

    const period = findBlackout(slotTime, bayId, blackoutPeriods)
    if (period) {
      if (openBlackout && openBlackoutId === period.id) {
        openBlackout.span++
      } else {
        openBlackout = { kind: 'blackout', rowStart, span: 1, reason: period.reason }
        openBlackoutId = period.id
        blocks.push(openBlackout)
      }
      continue
    }

    openBlackout = null
    blocks.push({ kind: 'open', rowStart, span: 1, slotTime })
  }

  return blocks.sort((a, b) => a.rowStart - b.rowStart)
}

function nowStatus(
  bayId: string,
  bookings: BookingWithMember[],
  now: Date,
  userId: string,
  blackoutPeriods: BlackoutPeriod[],
): BayNowStatus {
  const endOf = (b: BookingWithMember) =>
    addMinutes(new Date(b.start_time), b.duration_minutes)

  const current = bookings.find(
    (b) => !isBefore(now, new Date(b.start_time)) && isBefore(now, endOf(b)),
  )
  if (current) {
    return {
      kind: 'occupied',
      shortName: formatMemberName(current.members?.full_name),
      guestCount: current.guests?.length ?? 0,
      mine: current.member_id === userId,
      until: endOf(current),
    }
  }

  const blackout = findBlackout(now, bayId, blackoutPeriods)
  if (blackout) return { kind: 'blackout', reason: blackout.reason }

  const next = bookings
    .map((b) => new Date(b.start_time))
    .filter((d) => isBefore(now, d))
    .sort((a, b) => a.getTime() - b.getTime())[0]

  return { kind: 'open', until: next ?? null }
}

