export class TimeoutError extends Error {
  constructor(message = 'Timed out') {
    super(message)
    this.name = 'TimeoutError'
  }
}

// Rejects with TimeoutError if `promise` hasn't settled within `ms`.
// The underlying work is not cancelled — only the wait is.
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
