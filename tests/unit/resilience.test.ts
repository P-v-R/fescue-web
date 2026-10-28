import { describe, it, expect, vi, afterEach } from 'vitest'
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'
import {
  loginErrorMessage,
  LOGIN_INVALID_CREDENTIALS,
  LOGIN_UNAVAILABLE,
  LOGIN_RATE_LIMITED,
} from '@/lib/utils/auth-errors'
import { createSingleFlight } from '@/lib/utils/single-flight'
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

describe('createSingleFlight', () => {
  it('skips calls while a previous one is still in flight', async () => {
    let resolveTask!: () => void
    const task = vi.fn(() => new Promise<void>((r) => { resolveTask = r }))
    const poll = createSingleFlight(task, 20_000)

    const first = poll()
    await poll() // returns immediately — skipped
    await poll()
    expect(task).toHaveBeenCalledTimes(1)

    resolveTask()
    await first
    void poll() // free again — starts a new request
    expect(task).toHaveBeenCalledTimes(2)
    resolveTask()
  })

  it('aborts a hung request after the timeout and allows the next poll', async () => {
    vi.useFakeTimers()
    const signals: AbortSignal[] = []
    const task = vi.fn(
      (signal: AbortSignal) =>
        new Promise<void>((_, reject) => {
          signals.push(signal)
          signal.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    )
    const poll = createSingleFlight(task, 20_000)

    const first = poll()
    await vi.advanceTimersByTimeAsync(20_000)
    await first
    expect(signals[0].aborted).toBe(true)

    void poll()
    expect(task).toHaveBeenCalledTimes(2)
  })

  it('swallows task errors so the kiosk keeps its last good data', async () => {
    const poll = createSingleFlight(() => Promise.reject(new Error('500')), 20_000)
    await expect(poll()).resolves.toBeUndefined()
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
    const result = submitLogin(() => new Promise(() => {}), 15_000)
    await vi.advanceTimersByTimeAsync(15_000)
    await expect(result).resolves.toBe(LOGIN_TIMED_OUT)
  })

  it('shows a connection message when the request fails (iOS "Load failed")', async () => {
    await expect(submitLogin(() => Promise.reject(new TypeError('Load failed')))).resolves.toBe(
      LOGIN_NETWORK_ERROR,
    )
  })
})
