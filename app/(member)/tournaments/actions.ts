'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTournamentById } from '@/lib/supabase/queries/tournaments'
import {
  insertOwnRegistration,
  deleteOwnRegistration,
  getRegistrationCount,
  getMemberRegistration,
} from '@/lib/supabase/queries/tournament-registrations'

type Result = { error?: string; success?: string }

// A Postgres unique-violation surfaces as code 23505.
function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23505'
}

export async function registerForTournamentAction(tournamentId: string): Promise<Result> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    const tournament = await getTournamentById(tournamentId)
    if (!tournament) return { error: 'Tournament not found.' }
    if (tournament.status !== 'registration') {
      return { error: 'Registration is not open for this tournament.' }
    }
    if (tournament.registration_closes_at && new Date(tournament.registration_closes_at) < new Date()) {
      return { error: 'Registration has closed.' }
    }

    // Already registered? Treat as success (idempotent).
    const existing = await getMemberRegistration(tournamentId, user.id)
    if (existing) return { success: "You're registered." }

    if (tournament.capacity != null) {
      const count = await getRegistrationCount(tournamentId)
      if (count >= tournament.capacity) return { error: 'This tournament is full.' }
    }

    try {
      await insertOwnRegistration(tournamentId, user.id)
    } catch (err) {
      // Concurrent double-submit — the row already exists, which is fine.
      if (isUniqueViolation(err)) return { success: "You're registered." }
      throw err
    }

    revalidatePath('/tournaments')
    revalidatePath(`/tournaments/match-play/${tournamentId}`)
    revalidatePath('/admin')
    return { success: "You're registered." }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to register.' }
  }
}

export async function withdrawFromTournamentAction(tournamentId: string): Promise<Result> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    const tournament = await getTournamentById(tournamentId)
    if (!tournament) return { error: 'Tournament not found.' }
    if (tournament.status !== 'registration') {
      return { error: 'You can no longer withdraw — registration is closed.' }
    }

    await deleteOwnRegistration(tournamentId, user.id)

    revalidatePath('/tournaments')
    revalidatePath(`/tournaments/match-play/${tournamentId}`)
    revalidatePath('/admin')
    return { success: 'You have withdrawn.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to withdraw.' }
  }
}
