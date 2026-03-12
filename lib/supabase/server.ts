import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Use in Server Components, Server Actions, and Route Handlers.
// Reads and writes session cookies — call once per request, don't reuse across requests.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // setAll called from a Server Component — session refresh cookies
            // are set by middleware on next request, so this is safe to ignore.
          }
        },
      },
    },
  )
}
