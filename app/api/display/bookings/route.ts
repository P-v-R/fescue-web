import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDisplayBookingsForToday } from '@/lib/supabase/queries/display'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')

  if (!process.env.DISPLAY_TOKEN || token !== process.env.DISPLAY_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const bookings = await getDisplayBookingsForToday()
  return NextResponse.json(bookings)
}
