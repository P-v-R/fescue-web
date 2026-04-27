import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/queries/membership-requests', () => ({
  updateMembershipRequestStatus: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { markContactedAction } from '@/app/(admin)/admin/actions'
import { updateMembershipRequestStatus } from '@/lib/supabase/queries/membership-requests'

const mockCreateClient = createClient as ReturnType<typeof vi.fn>
const mockUpdateStatus = updateMembershipRequestStatus as ReturnType<typeof vi.fn>

function mockAdminAuth(adminId = 'admin-uuid') {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: adminId } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_admin: true, is_active: true } }),
    }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAdminAuth()
  mockUpdateStatus.mockResolvedValue(undefined)
})

describe('markContactedAction', () => {
  it('returns success message', async () => {
    const result = await markContactedAction('req-123')

    expect(result.success).toBe('Marked as contacted.')
    expect(result.error).toBeUndefined()
  })

  it('calls updateMembershipRequestStatus with contacted status', async () => {
    await markContactedAction('req-123')

    expect(mockUpdateStatus).toHaveBeenCalledWith(
      'req-123',
      'contacted',
      expect.objectContaining({ contacted_by: expect.any(String) }),
    )
  })

  it('records the admin id who marked as contacted', async () => {
    mockAdminAuth('specific-admin-id')

    await markContactedAction('req-123')

    expect(mockUpdateStatus).toHaveBeenCalledWith(
      'req-123',
      'contacted',
      expect.objectContaining({ contacted_by: 'specific-admin-id' }),
    )
  })

  it('records a contacted_at timestamp', async () => {
    const before = new Date().toISOString()
    await markContactedAction('req-123')
    const after = new Date().toISOString()

    const call = mockUpdateStatus.mock.calls[0]
    const meta = call[2] as { contacted_at: string }
    expect(meta.contacted_at >= before).toBe(true)
    expect(meta.contacted_at <= after).toBe(true)
  })

  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    })

    const result = await markContactedAction('req-123')

    expect(result.error).toBeTruthy()
    expect(mockUpdateStatus).not.toHaveBeenCalled()
  })

  it('returns error when updateMembershipRequestStatus throws', async () => {
    mockUpdateStatus.mockRejectedValue(new Error('DB error'))

    const result = await markContactedAction('req-123')

    expect(result.error).toBeTruthy()
  })
})
