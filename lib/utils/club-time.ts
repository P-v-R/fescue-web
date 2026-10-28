// The club operates on Pacific time. Servers (Railway) and CI run in UTC and
// members' browsers can be anywhere, so anything that compares against
// club-local dates/times (blackout periods, "today") must go through these
// helpers rather than Date#getHours / toISOString, which depend on the
// process timezone or are always UTC.

export const CLUB_TIMEZONE = 'America/Los_Angeles'

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CLUB_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function clubParts(date: Date): Record<'year' | 'month' | 'day' | 'hour' | 'minute', string> {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map((p) => [p.type, p.value]),
  )
  return parts as Record<'year' | 'month' | 'day' | 'hour' | 'minute', string>
}

/** 'YYYY-MM-DD' for this instant as seen at the club. */
export function clubDateKey(date: Date): string {
  const { year, month, day } = clubParts(date)
  return `${year}-${month}-${day}`
}

/** 'HH:MM' (24h) for this instant as seen at the club. */
export function clubTimeKey(date: Date): string {
  const { hour, minute } = clubParts(date)
  return `${hour}:${minute}`
}
