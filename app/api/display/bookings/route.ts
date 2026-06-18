import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDisplayBookingsForToday } from '@/lib/supabase/queries/display'
import { tokenValid } from '@/lib/utils/token'

export async function GET(request: NextRequest) {
  const raw = request.headers.get('authorization')
  const candidate = raw?.replace(/^Bearer /, '') ?? null

  if (!tokenValid(candidate, process.env.DISPLAY_TOKEN)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const bookings = await getDisplayBookingsForToday()
    return NextResponse.json(bookings)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
