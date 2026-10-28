// Server-side Supabase calls get a hard deadline so an outage fails fast
// instead of holding a request open for 30s+ (2026-10-28: Auth answered with
// 504s after ~36s). An aborted fetch surfaces as AuthRetryableFetchError for
// auth calls (mapped to "temporarily unavailable") and as a query error for
// PostgREST calls. Any signal the caller already set is still honoured.
export const SUPABASE_FETCH_TIMEOUT_MS = 10_000

export function fetchWithTimeout(timeoutMs = SUPABASE_FETCH_TIMEOUT_MS): typeof fetch {
  return async (input, init) => {
    // Combined by hand rather than AbortSignal.any so it runs in every runtime
    // (jsdom in tests lacks AbortSignal.any).
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const callerSignal = init?.signal
    const onCallerAbort = () => controller.abort()
    if (callerSignal?.aborted) controller.abort()
    else callerSignal?.addEventListener('abort', onCallerAbort, { once: true })
    try {
      return await fetch(input, { ...init, signal: controller.signal })
    } finally {
      clearTimeout(timer)
      callerSignal?.removeEventListener('abort', onCallerAbort)
    }
  }
}
