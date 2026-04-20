import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/queries/join-requests', () => ({
  getJoinRequestForApproval: vi.fn(),
  markJoinRequestApproved: vi.fn(),
  markJoinRequestDeclined: vi.fn(),
}))

vi.mock('@/lib/resend/client', () => ({
  isResendConfigured: vi.fn(() => false),
  createResendClient: vi.fn(),
  FROM_ADDRESSES: { noreply: 'noreply@fescuegolfclub.com' },
}))

vi.mock('@/lib/resend/templates/welcome', () => ({
  welcomeEmailHtml: vi.fn(() => '<html>'),
  welcomeEmailText: vi.fn(() => 'text'),
}))

// Admin client mock — returned object is reused across tests so we can mutate it
const mockAdminClient = {
  auth: {
    admin: {
      createUser: vi.fn(),
      listUsers: vi.fn(),
      deleteUser: vi.fn(),
      updateUserById: vi.fn(),
    },
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}))

// requireAdmin uses createClient — mock it to return an admin user
import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as ReturnType<typeof vi.fn>

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { approveJoinRequestAction } from '@/app/(admin)/admin/actions'
import { getJoinRequestForApproval, markJoinRequestApproved } from '@/lib/supabase/queries/join-requests'

const mockGetJoinRequest = getJoinRequestForApproval as ReturnType<typeof vi.fn>
const mockMarkApproved = markJoinRequestApproved as ReturnType<typeof vi.fn>

// ── Fixtures ─────────────────────────────────────────────────────────────────

const fakeRequest = {
  id: 'req-1',
  email: 'sara@example.com',
  password: 'secret123',
  full_name: 'Sara Camarena',
  phone: '(310) 555-0101',
  discord: null,
  sgt_username: null,
  member_since: 2026,
}

const fakeAuthUser = { id: 'auth-user-uuid' }

function mockAdminAuth() {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-id' } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_admin: true, is_active: true } }),
    }),
  })
}

function mockMembersInsert(error: { message: string } | null = null) {
  mockAdminClient.from.mockReturnValue({
    insert: vi.fn().mockResolvedValue({ error }),
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockAdminAuth()
  mockGetJoinRequest.mockResolvedValue(fakeRequest)
  mockMarkApproved.mockResolvedValue(undefined)
  mockAdminClient.auth.admin.updateUserById.mockResolvedValue({ error: null })
})

describe('approveJoinRequestAction', () => {
  describe('happy path — new auth user', () => {
    it('creates auth user and member row, returns success', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: fakeAuthUser },
        error: null,
      })
      mockMembersInsert(null)

      const result = await approveJoinRequestAction('req-1')

      expect(result.error).toBeUndefined()
      expect(result.success).toMatch(/Sara Camarena/)
      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: fakeRequest.email, email_confirm: true }),
      )
      expect(mockMarkApproved).toHaveBeenCalledWith('req-1')
      // New user: password is set at creation, not via updateUserById
      expect(mockAdminClient.auth.admin.updateUserById).not.toHaveBeenCalled()
    })
  })

  describe('existing auth user — Google OAuth pre-signup (issue #73)', () => {
    it('falls back to existing auth user when "already been registered" error is returned', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'A user with this email address has already been registered' },
      })
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [{ id: 'existing-uuid', email: fakeRequest.email }] },
      })
      mockMembersInsert(null)

      const result = await approveJoinRequestAction('req-1')

      expect(result.error).toBeUndefined()
      expect(result.success).toMatch(/Sara Camarena/)
      // Should have looked up the existing user
      expect(mockAdminClient.auth.admin.listUsers).toHaveBeenCalled()
      // Member row should be created with the existing user's ID
      expect(mockAdminClient.from).toHaveBeenCalledWith('members')
    })

    it('falls back when error message says "already registered"', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' },
      })
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [{ id: 'existing-uuid', email: fakeRequest.email }] },
      })
      mockMembersInsert(null)

      const result = await approveJoinRequestAction('req-1')

      expect(result.error).toBeUndefined()
    })

    it('returns error if existing auth user cannot be found in listUsers', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'A user with this email address has already been registered' },
      })
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] }, // not found
        error: null,
      })

      const result = await approveJoinRequestAction('req-1')

      expect(result.error).toMatch(/could not be located/)
    })

    it('returns error if listUsers itself fails', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'A user with this email address has already been registered' },
      })
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: null,
        error: { message: 'Service unavailable' },
      })

      const result = await approveJoinRequestAction('req-1')

      expect(result.error).toMatch(/Failed to look up existing auth user/)
    })

    it('does not delete the existing auth user if member insert fails', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'A user with this email address has already been registered' },
      })
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [{ id: 'existing-uuid', email: fakeRequest.email }] },
      })
      mockMembersInsert({ message: 'duplicate key' })

      const result = await approveJoinRequestAction('req-1')

      // Should error but must NOT delete the pre-existing OAuth account
      expect(result.error).toBeTruthy()
      expect(mockAdminClient.auth.admin.deleteUser).not.toHaveBeenCalled()
    })

    it('uses the existing auth user ID (not a new one) when creating the member row', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'A user with this email address has already been registered' },
      })
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [{ id: 'existing-uuid', email: fakeRequest.email }] },
      })
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      mockAdminClient.from.mockReturnValue({ insert: mockInsert })

      await approveJoinRequestAction('req-1')

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'existing-uuid' }))
    })

    it('sets password on existing OAuth user so they can also sign in via email/password', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'A user with this email address has already been registered' },
      })
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [{ id: 'existing-uuid', email: fakeRequest.email }] },
      })
      mockAdminClient.auth.admin.updateUserById.mockResolvedValue({ error: null })
      mockMembersInsert(null)

      await approveJoinRequestAction('req-1')

      expect(mockAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        'existing-uuid',
        expect.objectContaining({ password: fakeRequest.password }),
      )
    })

    it('returns error if updateUserById fails', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'A user with this email address has already been registered' },
      })
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [{ id: 'existing-uuid', email: fakeRequest.email }] },
      })
      mockAdminClient.auth.admin.updateUserById.mockResolvedValue({
        error: { message: 'Password too weak' },
      })

      const result = await approveJoinRequestAction('req-1')

      expect(result.error).toMatch(/Failed to set password for existing auth user/)
    })
  })

  describe('other auth errors', () => {
    it('returns error for non-duplicate auth failures', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'Service unavailable' },
      })

      const result = await approveJoinRequestAction('req-1')

      expect(result.error).toMatch(/Failed to create auth user/)
      expect(mockAdminClient.auth.admin.listUsers).not.toHaveBeenCalled()
    })
  })

  describe('member insert failure', () => {
    it('rolls back newly created auth user on member insert failure', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: fakeAuthUser },
        error: null,
      })
      mockMembersInsert({ message: 'constraint violation' })

      const result = await approveJoinRequestAction('req-1')

      expect(result.error).toMatch(/Failed to create member profile/)
      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(fakeAuthUser.id)
    })
  })
})
