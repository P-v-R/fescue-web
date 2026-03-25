import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the query functions before importing the action
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('submitMembershipRequestAction', () => {
  it('creates a request and returns success for valid new input', async () => {
    mockGetByEmail.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: '123', status: 'pending' })

    const result = await submitMembershipRequestAction({
      full_name: 'Jane Smith',
      email: 'jane@example.com',
    })

    expect(result.success).toBeTruthy()
    expect(result.error).toBeUndefined()
    expect(mockCreate).toHaveBeenCalledOnce()
  })

  it('returns success (not error) for duplicate email', async () => {
    mockGetByEmail.mockResolvedValue({ id: '456', status: 'pending', email: 'jane@example.com' })

    const result = await submitMembershipRequestAction({
      full_name: 'Jane Smith',
      email: 'jane@example.com',
    })

    expect(result.success).toBeTruthy()
    expect(result.duplicate).toBe(true)
    expect(result.error).toBeUndefined()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('normalizes email to lowercase before duplicate check', async () => {
    mockGetByEmail.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: '789' })

    await submitMembershipRequestAction({
      full_name: 'Jane Smith',
      email: 'JANE@EXAMPLE.COM',
    })

    expect(mockGetByEmail).toHaveBeenCalledWith('jane@example.com')
    expect(mockCreate).toHaveBeenCalledWith('Jane Smith', 'jane@example.com', undefined)
  })

  it('returns validation error when full_name is missing', async () => {
    const result = await submitMembershipRequestAction({
      full_name: '',
      email: 'jane@example.com',
    })

    expect(result.error).toBeTruthy()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns validation error for invalid email', async () => {
    const result = await submitMembershipRequestAction({
      full_name: 'Jane Smith',
      email: 'not-an-email',
    })

    expect(result.error).toMatch(/valid email/i)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns error when query throws', async () => {
    mockGetByEmail.mockResolvedValue(null)
    mockCreate.mockRejectedValue(new Error('Database error'))

    const result = await submitMembershipRequestAction({
      full_name: 'Jane Smith',
      email: 'jane@example.com',
    })

    expect(result.error).toBe('Database error')
    expect(result.success).toBeUndefined()
  })

  it('passes message through when provided', async () => {
    mockGetByEmail.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: '123' })

    await submitMembershipRequestAction({
      full_name: 'Jane Smith',
      email: 'jane@example.com',
      message: 'Looking forward to joining!',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      'Jane Smith',
      'jane@example.com',
      'Looking forward to joining!',
    )
  })
})
