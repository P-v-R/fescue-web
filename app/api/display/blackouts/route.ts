import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDisplayBlackoutsForToday } from '@/lib/supabase/queries/display'
import { tokenValid } from '@/lib/utils/token'

// Separate from /api/display/bookings so kiosks still running the previous
// client (which expects a bare bookings array) keep working until they reload.
// Same deadline as the bookings route: stop working when the kiosk disconnects
// or after 10s, so abandoned polls don't pile up on a struggling database.
const QUERY_TIMEOUT_MS = 10_000

export async function GET(request: NextRequest) {
  const raw = request.headers.get('authorization')
  const candidate = raw?.replace(/^Bearer /, '') ?? null

  if (!tokenValid(candidate, process.env.DISPLAY_TOKEN)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(QUERY_TIMEOUT_MS)])

  try {
    const blackouts = await getDisplayBlackoutsForToday(signal)
    return NextResponse.json(blackouts)
  } catch {
    if (signal.aborted) {
      return NextResponse.json(
        { error: 'Blackouts temporarily unavailable' },
        { status: 503, headers: { 'Retry-After': '30' } },
      )
    }
    return NextResponse.json({ error: 'Failed to fetch blackouts' }, { status: 500 })
  }
}
