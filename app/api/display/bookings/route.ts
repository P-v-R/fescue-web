import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDisplayBookingsForToday } from '@/lib/supabase/queries/display'
import { tokenValid } from '@/lib/utils/token'

// Give up on the database before the kiosk does, and stop working as soon as
// the kiosk disconnects — otherwise abandoned polls keep running against a
// struggling database (2026-10-28 outage).
const QUERY_TIMEOUT_MS = 10_000

export async function GET(request: NextRequest) {
  const raw = request.headers.get('authorization')
  const candidate = raw?.replace(/^Bearer /, '') ?? null

  if (!tokenValid(candidate, process.env.DISPLAY_TOKEN)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(QUERY_TIMEOUT_MS)])

  try {
    const bookings = await getDisplayBookingsForToday(signal)
    return NextResponse.json(bookings)
  } catch {
    if (signal.aborted) {
      return NextResponse.json(
        { error: 'Bookings temporarily unavailable' },
        { status: 503, headers: { 'Retry-After': '30' } },
      )
    }
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
