import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDisplayBlackoutsForToday } from '@/lib/supabase/queries/display'
import { tokenValid } from '@/lib/utils/token'

// Separate from /api/display/bookings so kiosks still running the previous
// client (which expects a bare bookings array) keep working until they reload.
export async function GET(request: NextRequest) {
  const raw = request.headers.get('authorization')
  const candidate = raw?.replace(/^Bearer /, '') ?? null

  if (!tokenValid(candidate, process.env.DISPLAY_TOKEN)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const blackouts = await getDisplayBlackoutsForToday()
    return NextResponse.json(blackouts)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch blackouts' }, { status: 500 })
  }
}
