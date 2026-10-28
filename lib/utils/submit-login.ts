import { unstable_rethrow } from 'next/navigation'
import { withTimeout, TimeoutError } from './with-timeout'

// Normal sign-in takes well under a second. The server gives up on Supabase
// after 10s (lib/supabase/fetch-with-timeout.ts) and returns "temporarily
// unavailable"; this client timeout is a backstop for when the server itself
// or the network is unreachable, so it must stay above the server deadline.
const LOGIN_TIMEOUT_MS = 15_000

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
): Promise<string | null> {
  try {
    const result = await withTimeout(action(), LOGIN_TIMEOUT_MS)
    return result?.error ?? null
  } catch (err) {
    unstable_rethrow(err)
    return err instanceof TimeoutError ? LOGIN_TIMED_OUT : LOGIN_NETWORK_ERROR
  }
}
