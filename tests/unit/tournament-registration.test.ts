import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/queries/tournaments', () => ({
  getTournamentById: vi.fn(),
}))

vi.mock('@/lib/supabase/queries/tournament-registrations', () => ({
  insertOwnRegistration: vi.fn(),
  deleteOwnRegistration: vi.fn(),
  getRegistrationCount: vi.fn(),
  getMemberRegistration: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getTournamentById } from '@/lib/supabase/queries/tournaments'
import {
  insertOwnRegistration,
  deleteOwnRegistration,
  getRegistrationCount,
  getMemberRegistration,
} from '@/lib/supabase/queries/tournament-registrations'
import {
  registerForTournamentAction,
  withdrawFromTournamentAction,
} from '@/app/(member)/tournaments/actions'
import type { Tournament } from '@/lib/supabase/types'

const mockCreateClient = createClient as ReturnType<typeof vi.fn>
const mockGetTournament = getTournamentById as ReturnType<typeof vi.fn>
const mockInsert = insertOwnRegistration as ReturnType<typeof vi.fn>
const mockDelete = deleteOwnRegistration as ReturnType<typeof vi.fn>
const mockCount = getRegistrationCount as ReturnType<typeof vi.fn>
const mockGetReg = getMemberRegistration as ReturnType<typeof vi.fn>

function mockUser(id: string | null) {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: id ? { id } : null } }),
    },
  })
}

function tournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: 't1',
    name: 'Club Championship',
    description: null,
    format: 'single_elim',
    status: 'registration',
    capacity: null,
    registration_closes_at: null,
    starts_at: null,
    champion_registration_id: null,
    created_by: null,
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUser('member-1')
  mockGetTournament.mockResolvedValue(tournament())
  mockGetReg.mockResolvedValue(null)
  mockCount.mockResolvedValue(0)
  mockInsert.mockResolvedValue(undefined)
  mockDelete.mockResolvedValue(undefined)
})

describe('registerForTournamentAction', () => {
  it('rejects when not signed in', async () => {
    mockUser(null)
    const result = await registerForTournamentAction('t1')
    expect(result.error).toBe('Not signed in.')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('rejects when the tournament does not exist', async () => {
    mockGetTournament.mockResolvedValue(null)
    const result = await registerForTournamentAction('t1')
    expect(result.error).toBe('Tournament not found.')
  })

  it('rejects when registration is not open', async () => {
    mockGetTournament.mockResolvedValue(tournament({ status: 'draft' }))
    const result = await registerForTournamentAction('t1')
    expect(result.error).toBe('Registration is not open for this tournament.')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('rejects when the registration deadline has passed', async () => {
    mockGetTournament.mockResolvedValue(
      tournament({ registration_closes_at: '2000-01-01T00:00:00Z' }),
    )
    const result = await registerForTournamentAction('t1')
    expect(result.error).toBe('Registration has closed.')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('is idempotent when already registered', async () => {
    mockGetReg.mockResolvedValue({ id: 'r1', tournament_id: 't1', member_id: 'member-1', seed: null, created_at: '' })
    const result = await registerForTournamentAction('t1')
    expect(result.success).toBe("You're registered.")
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('rejects when the tournament is full', async () => {
    mockGetTournament.mockResolvedValue(tournament({ capacity: 8 }))
    mockCount.mockResolvedValue(8)
    const result = await registerForTournamentAction('t1')
    expect(result.error).toBe('This tournament is full.')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('registers the member on the happy path', async () => {
    const result = await registerForTournamentAction('t1')
    expect(result.success).toBe("You're registered.")
    expect(mockInsert).toHaveBeenCalledWith('t1', 'member-1')
  })

  it('treats a unique-violation race as success', async () => {
    mockInsert.mockRejectedValue({ code: '23505' })
    const result = await registerForTournamentAction('t1')
    expect(result.success).toBe("You're registered.")
    expect(result.error).toBeUndefined()
  })
})

describe('withdrawFromTournamentAction', () => {
  it('rejects when not signed in', async () => {
    mockUser(null)
    const result = await withdrawFromTournamentAction('t1')
    expect(result.error).toBe('Not signed in.')
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('blocks withdrawal once registration has closed', async () => {
    mockGetTournament.mockResolvedValue(tournament({ status: 'seeding' }))
    const result = await withdrawFromTournamentAction('t1')
    expect(result.error).toBe('You can no longer withdraw — registration is closed.')
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('withdraws the member on the happy path', async () => {
    const result = await withdrawFromTournamentAction('t1')
    expect(result.success).toBe('You have withdrawn.')
    expect(mockDelete).toHaveBeenCalledWith('t1', 'member-1')
  })
})
