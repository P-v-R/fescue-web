import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/queries/join-requests', () => ({
  createJoinRequest: vi.fn(),
}))

vi.mock('@/lib/utils/crypto', () => ({
  encryptPassword: vi.fn((pw: string) => `encrypted:${pw}`),
}))

import { submitJoinRequestAction } from '@/app/(public)/join/actions'
import { createJoinRequest } from '@/lib/supabase/queries/join-requests'

const mockCreate = createJoinRequest as ReturnType<typeof vi.fn>

const validInput = {
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '(310) 555-0200',
  discord: 'johndoe#1234',
  sgt_username: undefined,
  member_since: 2024,
  password: 'supersecret123',
  confirm_password: 'supersecret123',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('submitJoinRequestAction', () => {
  it('creates a join request and returns empty object on success', async () => {
    mockCreate.mockResolvedValue(undefined)

    const result = await submitJoinRequestAction(validInput)

    expect(result).toEqual({})
    expect(mockCreate).toHaveBeenCalledOnce()
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '(310) 555-0200',
        discord: 'johndoe#1234',
        member_since: 2024,
        encrypted_password: 'encrypted:supersecret123',
      }),
    )
  })

  it('normalizes email to lowercase', async () => {
    mockCreate.mockResolvedValue(undefined)

    await submitJoinRequestAction({ ...validInput, email: 'JOHN@EXAMPLE.COM' })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'john@example.com' }),
    )
  })

  it('returns error when query throws', async () => {
    mockCreate.mockRejectedValue(new Error('DB unavailable'))

    const result = await submitJoinRequestAction(validInput)

    expect(result.error).toBe('DB unavailable')
    expect(result).not.toHaveProperty('success')
  })

  it('returns validation error when full_name is too short', async () => {
    const result = await submitJoinRequestAction({ ...validInput, full_name: 'X' })

    expect(result.error).toBeTruthy()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns validation error for invalid email', async () => {
    const result = await submitJoinRequestAction({ ...validInput, email: 'not-an-email' })

    expect(result.error).toMatch(/valid email/i)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns validation error when passwords do not match', async () => {
    const result = await submitJoinRequestAction({
      ...validInput,
      confirm_password: 'different',
    })

    expect(result.error).toMatch(/passwords do not match/i)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  describe('honeypot spam filter', () => {
    it('returns success without creating a record when honeypot is filled', async () => {
      const result = await submitJoinRequestAction(validInput, 'spambot-value')

      expect(result).toEqual({})
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('proceeds normally when honeypot is empty string', async () => {
      mockCreate.mockResolvedValue(undefined)

      const result = await submitJoinRequestAction(validInput, '')

      expect(result).toEqual({})
      expect(mockCreate).toHaveBeenCalledOnce()
    })
  })
})
