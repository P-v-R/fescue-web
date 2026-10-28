import { unstable_rethrow } from 'next/navigation'
import { withTimeout, TimeoutError } from './with-timeout'

// Normal sign-in takes well under a second. When Supabase is degraded the
// request can hang 30s+ and then fail silently, so give up visibly instead.
export const LOGIN_TIMEOUT_MS = 15_000

export const LOGIN_TIMED_OUT =
  'Sign-in is taking longer than usual. Check your connection and try again.'
export const LOGIN_NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again."

/**
 * Runs the login server action and returns the message to show, or null.
 * A successful login redirects — Next delivers that by rejecting the action
 * promise with a redirect error, which is rethrown so the router handles it.
 */
export async function submitLogin(
  action: () => Promise<{ error: string } | undefined | void>,
  timeoutMs = LOGIN_TIMEOUT_MS,
): Promise<string | null> {
  try {
    const result = await withTimeout(action(), timeoutMs)
    return result?.error ?? null
  } catch (err) {
    unstable_rethrow(err)
    return err instanceof TimeoutError ? LOGIN_TIMED_OUT : LOGIN_NETWORK_ERROR
  }
}
