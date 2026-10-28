// Wraps a periodic request so that at most one is in flight at a time and each
// attempt is aborted after `timeoutMs`. Used by the bay kiosk's polling: when
// the database is slow, unguarded polls stack up (a new request every 30s while
// earlier ones hang for 60s+), adding load exactly when it can least take it.
export function createSingleFlight(
  task: (signal: AbortSignal) => Promise<void>,
  timeoutMs: number,
): () => Promise<void> {
  let inFlight = false

  return async () => {
    if (inFlight) return
    inFlight = true
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      await task(controller.signal)
    } catch {
      // Swallowed: callers keep showing their last good data
    } finally {
      clearTimeout(timer)
      inFlight = false
    }
  }
}
