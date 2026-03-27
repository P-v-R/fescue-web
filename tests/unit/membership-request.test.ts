import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/queries/membership-requests', () => ({
  getMembershipRequestByEmailAdmin: vi.fn(),
  createMembershipRequest: vi.fn(),
}))

import { submitMembershipRequestAction } from '@/app/(public)/membership/actions'
import {
  getMembershipRequestByEmailAdmin,
  createMembershipRequest,
} from '@/lib/supabase/queries/membership-requests'

const mockGetByEmail = getMembershipRequestByEmailAdmin as ReturnType<typeof vi.fn>
const mockCreate = createMembershipRequest as ReturnType<typeof vi.fn>

const validInput = {
  full_name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '(310) 555-0100',
  profession: 'Architect',
  referral_source: 'A friend',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('submitMembershipRequestAction', () => {
  it('creates a request and returns success for valid input', async () => {
    mockGetByEmail.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: '123', status: 'pending' })

    const result = await submitMembershipRequestAction(validInput)

    expect(result.success).toBeTruthy()
    expect(result.error).toBeUndefined()
    expect(mockCreate).toHaveBeenCalledOnce()
  })

  it('returns success (not error) for duplicate email', async () => {
    mockGetByEmail.mockResolvedValue({ id: '456', status: 'pending', email: 'jane@example.com' })

    const result = await submitMembershipRequestAction(validInput)

    expect(result.success).toBeTruthy()
    expect(result.duplicate).toBe(true)
    expect(result.error).toBeUndefined()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('normalizes email to lowercase before duplicate check', async () => {
    mockGetByEmail.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: '789' })

    await submitMembershipRequestAction({ ...validInput, email: 'JANE@EXAMPLE.COM' })

    expect(mockGetByEmail).toHaveBeenCalledWith('jane@example.com')
  })

  it('returns validation error when full_name is missing', async () => {
    const result = await submitMembershipRequestAction({ ...validInput, full_name: '' })

    expect(result.error).toBeTruthy()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns validation error for invalid email', async () => {
    const result = await submitMembershipRequestAction({ ...validInput, email: 'not-an-email' })

    expect(result.error).toMatch(/valid email/i)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns validation error when phone is missing', async () => {
    const result = await submitMembershipRequestAction({ ...validInput, phone: '' })

    expect(result.error).toBeTruthy()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns validation error when profession is missing', async () => {
    const result = await submitMembershipRequestAction({ ...validInput, profession: '' })

    expect(result.error).toBeTruthy()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns validation error when referral_source is missing', async () => {
    const result = await submitMembershipRequestAction({ ...validInput, referral_source: '' })

    expect(result.error).toBeTruthy()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns error when query throws', async () => {
    mockGetByEmail.mockResolvedValue(null)
    mockCreate.mockRejectedValue(new Error('Database error'))

    const result = await submitMembershipRequestAction(validInput)

    expect(result.error).toBe('Database error')
    expect(result.success).toBeUndefined()
  })

  it('passes optional fields through when provided', async () => {
    mockGetByEmail.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: '123' })

    await submitMembershipRequestAction({
      ...validInput,
      zip_code: '90210',
      has_membership_org: true,
      membership_org_names: 'Riviera CC',
      message: 'Love golf.',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        zip_code: '90210',
        has_membership_org: true,
        membership_org_names: 'Riviera CC',
        message: 'Love golf.',
      }),
    )
  })

  it('omits empty optional fields', async () => {
    mockGetByEmail.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: '123' })

    await submitMembershipRequestAction(validInput)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '(310) 555-0100',
      }),
    )
  })
})
