import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  AuthApiError,
  AuthRetryableFetchError,
  createClient as createSupabaseClient,
} from '@supabase/supabase-js'
import { fetchWithTimeout } from '@/lib/supabase/fetch-with-timeout'
import {
  loginErrorMessage,
  LOGIN_INVALID_CREDENTIALS,
  LOGIN_UNAVAILABLE,
  LOGIN_RATE_LIMITED,
} from '@/lib/utils/auth-errors'
import { startPoller } from '@/lib/utils/poller'
import { withTimeout, TimeoutError } from '@/lib/utils/with-timeout'
import { submitLogin, LOGIN_TIMED_OUT, LOGIN_NETWORK_ERROR } from '@/lib/utils/submit-login'
import { redirect } from 'next/navigation'

afterEach(() => {
  vi.useRealTimers()
})

describe('loginErrorMessage', () => {
  it('treats a Supabase 504 timeout as an outage, not a wrong password', () => {
    // What Auth returned during the Oct 2026 Disk IO outage
    const err = new AuthRetryableFetchError('Gateway Timeout', 504)
    expect(loginErrorMessage(err)).toBe(LOGIN_UNAVAILABLE)
  })

  it('treats a network failure (status 0) as an outage', () => {
    expect(loginErrorMessage(new AuthRetryableFetchError('fetch failed', 0))).toBe(LOGIN_UNAVAILABLE)
  })

  it('treats any 5xx API error as an outage', () => {
    expect(loginErrorMessage(new AuthApiError('boom', 500, undefined))).toBe(LOGIN_UNAVAILABLE)
  })

  it('reports rate limiting distinctly', () => {
    expect(loginErrorMessage(new AuthApiError('slow down', 429, 'over_request_rate_limit'))).toBe(
      LOGIN_RATE_LIMITED,
    )
  })

  it('keeps the generic message for bad credentials', () => {
    const err = new AuthApiError('Invalid login credentials', 400, 'invalid_credentials')
    expect(loginErrorMessage(err)).toBe(LOGIN_INVALID_CREDENTIALS)
  })
})

describe('startPoller', () => {
  const opts = { intervalMs: 30_000, timeoutMs: 15_000, maxBackoffMs: 300_000, jitter: 0 }

  it('never overlaps: the next poll is scheduled only after the current one settles', async () => {
    vi.useFakeTimers()
    let resolveTask!: () => void
    const task = vi.fn(() => new Promise<void>((r) => { resolveTask = r }))
    const stop = startPoller(task, { ...opts, timeoutMs: 120_000 })

    await vi.advanceTimersByTimeAsync(30_000)
    expect(task).toHaveBeenCalledTimes(1)
    // A slow response (the outage case): 90s pass with no new requests
    await vi.advanceTimersByTimeAsync(90_000)
    expect(task).toHaveBeenCalledTimes(1)

    resolveTask()
    await vi.advanceTimersByTimeAsync(30_000)
    expect(task).toHaveBeenCalledTimes(2)
    stop()
  })

  it('aborts an attempt that exceeds the timeout', async () => {
    vi.useFakeTimers()
    const signals: AbortSignal[] = []
    const task = vi.fn(
      (signal: AbortSignal) =>
        new Promise<void>((_, reject) => {
          signals.push(signal)
          signal.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    )
    const stop = startPoller(task, opts)
    await vi.advanceTimersByTimeAsync(30_000 + 15_000)
    expect(signals[0].aborted).toBe(true)
    stop()
  })

  it('backs off exponentially on failure, capped, and recovers after a success', async () => {
    vi.useFakeTimers()
    let fail = true
    const calls: number[] = []
    const task = vi.fn(async () => {
      calls.push(Date.now())
      if (fail) throw new Error('503')
    })
    const start = Date.now()
    const stop = startPoller(task, opts)

    // first poll at 30s, then failures back off: 60s, 120s, 240s, 300s (cap), 300s
    await vi.advanceTimersByTimeAsync(30_000 + 60_000 + 120_000 + 240_000 + 300_000 + 300_000)
    const gaps = calls.map((t, i) => t - (i === 0 ? start : calls[i - 1]))
    expect(gaps).toEqual([30_000, 60_000, 120_000, 240_000, 300_000, 300_000])

    fail = false
    await vi.advanceTimersByTimeAsync(300_000) // next attempt succeeds
    const before = task.mock.calls.length
    await vi.advanceTimersByTimeAsync(30_000) // back to the normal interval
    expect(task.mock.calls.length).toBe(before + 1)
    stop()
  })

  it('applies jitter within ±20% by default', async () => {
    vi.useFakeTimers()
    const task = vi.fn(async () => {})
    const stop = startPoller(task, { ...opts, jitter: undefined, random: () => 1 }) // +20%
    await vi.advanceTimersByTimeAsync(35_999)
    expect(task).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(task).toHaveBeenCalledTimes(1)
    stop()
  })

  it('stop() cancels the timer and aborts an in-flight attempt', async () => {
    vi.useFakeTimers()
    let signal!: AbortSignal
    const task = vi.fn((s: AbortSignal) => { signal = s; return new Promise<void>(() => {}) })
    const stop = startPoller(task, opts)
    await vi.advanceTimersByTimeAsync(30_000)
    stop()
    expect(signal.aborted).toBe(true)
    await vi.advanceTimersByTimeAsync(600_000)
    expect(task).toHaveBeenCalledTimes(1)
  })
})

describe('withTimeout', () => {
  it('resolves with the value when the promise settles in time', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok')
  })

  it('rejects with TimeoutError when the promise hangs', async () => {
    vi.useFakeTimers()
    const hung = new Promise(() => {})
    const result = withTimeout(hung, 15_000)
    const assertion = expect(result).rejects.toBeInstanceOf(TimeoutError)
    await vi.advanceTimersByTimeAsync(15_000)
    await assertion
  })

  it('passes through the original rejection', async () => {
    await expect(withTimeout(Promise.reject(new Error('Load failed')), 1000)).rejects.toThrow(
      'Load failed',
    )
  })
})

describe('submitLogin', () => {
  it('lets a successful-login redirect through to the router', async () => {
    let redirectError: unknown
    try {
      redirect('/dashboard')
    } catch (e) {
      redirectError = e
    }
    // Next rejects the action promise with the redirect on success
    await expect(submitLogin(() => Promise.reject(redirectError))).rejects.toBe(redirectError)
  })

  it('returns the server action error message', async () => {
    await expect(submitLogin(() => Promise.resolve({ error: 'Invalid email or password. Please try again.' }))).resolves.toBe(
      'Invalid email or password. Please try again.',
    )
  })

  it('returns null when the action resolves without an error', async () => {
    await expect(submitLogin(() => Promise.resolve(undefined))).resolves.toBeNull()
  })

  it('shows a timeout message when the action hangs', async () => {
    vi.useFakeTimers()
    const result = submitLogin(() => new Promise(() => {}))
    await vi.advanceTimersByTimeAsync(15_000)
    await expect(result).resolves.toBe(LOGIN_TIMED_OUT)
  })

  it('shows a connection message when the request fails (iOS "Load failed")', async () => {
    await expect(submitLogin(() => Promise.reject(new TypeError('Load failed')))).resolves.toBe(
      LOGIN_NETWORK_ERROR,
    )
  })
})

describe('fetchWithTimeout + Supabase (server-side login deadline)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // A network that never answers, but honours abort — like Auth during the outage
  function stubHungFetch() {
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('The operation was aborted.', 'AbortError')),
          )
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('turns a hung Auth request into "temporarily unavailable"', async () => {
    stubHungFetch()
    const supabase = createSupabaseClient('https://example.supabase.co', 'anon-key', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetchWithTimeout(50) },
    })
    const { error } = await supabase.auth.signInWithPassword({
      email: 'member@example.com',
      password: 'irrelevant',
    })
    expect(loginErrorMessage(error)).toBe(LOGIN_UNAVAILABLE)
  })

  it('still honours a caller-supplied abort signal', async () => {
    const fetchMock = stubHungFetch()
    const controller = new AbortController()
    const pending = fetchWithTimeout(60_000)('https://example.com', { signal: controller.signal })
    controller.abort()
    await expect(pending).rejects.toThrow(/aborted/i)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
