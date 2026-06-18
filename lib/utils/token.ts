import { createHash, timingSafeEqual } from 'crypto'

/** Constant-time token comparison to prevent timing side-channel attacks. */
export function tokenValid(candidate: string | null | undefined, secret: string | undefined): boolean {
  if (!secret || !candidate) return false
  const a = createHash('sha256').update(candidate).digest()
  const b = createHash('sha256').update(secret).digest()
  return timingSafeEqual(a, b)
}
