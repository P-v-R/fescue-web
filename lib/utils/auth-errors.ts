import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js'

export const LOGIN_INVALID_CREDENTIALS = 'Invalid email or password. Please try again.'
export const LOGIN_UNAVAILABLE =
  'Sign-in is temporarily unavailable. Try again in a few minutes.'
export const LOGIN_RATE_LIMITED = 'Too many sign-in attempts. Wait a minute and try again.'

// Maps a Supabase sign-in error to what the member sees. Outages (timeouts,
// 5xx) must not read as "wrong password" — during the Oct 2026 Disk IO outage
// Auth returned 504s and members were told their password was wrong.
// Timeouts and network failures arrive as AuthRetryableFetchError (status 0).
export function loginErrorMessage(error: unknown): string {
  if (isAuthRetryableFetchError(error)) return LOGIN_UNAVAILABLE
  const status = isAuthError(error) ? error.status : undefined
  if (status === 429) return LOGIN_RATE_LIMITED
  if (status !== undefined && status >= 500) return LOGIN_UNAVAILABLE
  // Don't leak whether the email exists
  return LOGIN_INVALID_CREDENTIALS
}
