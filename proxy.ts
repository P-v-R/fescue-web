import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MEMBER_ROUTES = ['/dashboard', '/calendar', '/reservations', '/account', '/tournaments']
const ADMIN_ROUTES = ['/admin', '/studio']
const AUTH_ROUTES = ['/login', '/forgot-password']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Build the Supabase client — must use the request/response cookie pattern
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: use getUser() not getSession() — getSession() can be spoofed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  // Exclude the reset-password page — recovery token arrives in the URL hash (client-side only)
  // so the server sees no session and would incorrectly redirect to /login
  const isMemberRoute =
    pathname !== '/account/reset-password' &&
    MEMBER_ROUTES.some((r) => pathname.startsWith(r))

  // No session — redirect to login for any protected route
  if (!user && (isMemberRoute || isAdminRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Has session — redirect away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Admin route — check is_admin in the members table
  if (user && isAdminRoute) {
    const { data: member } = await supabase
      .from('members')
      .select('is_admin, is_active')
      .eq('id', user.id)
      .single()

    if (!member?.is_admin || !member?.is_active) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // No active member row — sign them out and redirect to login.
  // Catches deactivated members AND Google OAuth users who were never invited.
  if (user && (isMemberRoute || isAdminRoute)) {
    const { data: member } = await supabase
      .from('members')
      .select('is_active')
      .eq('id', user.id)
      .single()

    if (!member || !member.is_active) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'not_a_member')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all routes except static assets
    '/((?!monitoring|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
