export type PollerOptions = {
  /** Delay between polls while healthy */
  intervalMs: number
  /** Abort a single attempt after this long */
  timeoutMs: number
  /** Upper bound for the backoff delay after repeated failures */
  maxBackoffMs: number
  /** ± fraction of randomness so multiple kiosks don't sync up (default 0.2) */
  jitter?: number
  /** Injectable for tests */
  random?: () => number
}

/**
 * Polls `task` on a self-scheduling timer: the next attempt is only scheduled
 * after the current one settles, so attempts never overlap. Each attempt is
 * aborted after `timeoutMs`. Failures back off exponentially (capped) so a
 * struggling backend gets fewer requests, not more — during the 2026-10-28
 * outage a fixed 30s interval kept hitting a database that took 60s+ per query.
 *
 * Returns `stop()`, which cancels the timer and aborts any in-flight attempt.
 */
export function startPoller(
  task: (signal: AbortSignal) => Promise<void>,
  { intervalMs, timeoutMs, maxBackoffMs, jitter = 0.2, random = Math.random }: PollerOptions,
): () => void {
  let stopped = false
  let failures = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined

  const withJitter = (ms: number) => ms * (1 + (random() * 2 - 1) * jitter)

  const schedule = () => {
    if (stopped) return
    const base = failures === 0 ? intervalMs : Math.min(intervalMs * 2 ** failures, maxBackoffMs)
    timer = setTimeout(run, withJitter(base))
  }

  const run = async () => {
    controller = new AbortController()
    const attemptTimer = setTimeout(() => controller?.abort(), timeoutMs)
    try {
      await task(controller.signal)
      failures = 0
    } catch {
      failures++
    } finally {
      clearTimeout(attemptTimer)
      controller = undefined
      schedule()
    }
  }

  schedule()

  return () => {
    stopped = true
    clearTimeout(timer)
    controller?.abort()
  }
}
