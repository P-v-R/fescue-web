import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js'

export const LOGIN_INVALID_CREDENTIALS = 'Invalid email or password. Please try again.'
export const LOGIN_UNAVAILABLE =
  'Sign-in is temporarily unavailable. Try again in a few minutes.'
export const LOGIN_RATE_LIMITED = 'Too many sign-in attempts. Wait a minute and try again.'

// Maps a Supabase sign-in error to what the member sees. Outages (timeouts,
// 5xx) must not read as "wrong password" — during the Oct 2026 Disk IO outage
// Auth returned 504s and members were told their password was wrong.
export function loginErrorMessage(error: Pick<AuthError, 'status'> | unknown): string {
  if (isAuthRetryableFetchError(error)) return LOGIN_UNAVAILABLE
  const status = (error as { status?: number } | null)?.status
  if (status === 429) return LOGIN_RATE_LIMITED
  if (typeof status === 'number' && status >= 500) return LOGIN_UNAVAILABLE
  // Don't leak whether the email exists
  return LOGIN_INVALID_CREDENTIALS
}
