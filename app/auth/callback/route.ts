import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Supabase PKCE auth callback — exchanges the one-time code for a session,
// then redirects to the originally requested page (e.g. /account/reset-password).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  // Reject anything that isn't a plain path to prevent open redirect abuse
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  // Use the public app URL as the origin so reverse-proxy setups (e.g. Railway)
  // don't redirect to the internal localhost address.
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? ''

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Code missing or exchange failed — send back to login with a message
  return NextResponse.redirect(`${origin}/login?error=invalid_reset_link`)
}
