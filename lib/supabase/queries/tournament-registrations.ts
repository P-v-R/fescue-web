import { createClient } from '../server'
import { createAdminClient } from '../admin'
import type { TournamentRegistration, TournamentRegistrationWithMember } from '../types'

// Member + admin — full field for a tournament, with member display fields, in sign-up order.
export async function getRegistrationsForTournament(
  tournamentId: string,
): Promise<TournamentRegistrationWithMember[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tournament_registrations')
    .select('*, members(full_name, sgt_username)')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`getRegistrationsForTournament: ${error.message}`)
  return (data ?? []) as TournamentRegistrationWithMember[]
}

// Admin — registrations across many tournaments (for the admin panel rosters).
export async function getRegistrationsForTournaments(
  tournamentIds: string[],
): Promise<TournamentRegistrationWithMember[]> {
  if (tournamentIds.length === 0) return []
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tournament_registrations')
    .select('*, members(full_name, sgt_username)')
    .in('tournament_id', tournamentIds)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`getRegistrationsForTournaments: ${error.message}`)
  return (data ?? []) as TournamentRegistrationWithMember[]
}

// Member — the caller's own registration for a tournament, if any.
export async function getMemberRegistration(
  tournamentId: string,
  memberId: string,
): Promise<TournamentRegistration | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tournament_registrations')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('member_id', memberId)
    .maybeSingle()
  if (error) throw new Error(`getMemberRegistration: ${error.message}`)
  return (data as TournamentRegistration) ?? null
}

export async function getRegistrationCount(tournamentId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('tournament_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
  if (error) throw new Error(`getRegistrationCount: ${error.message}`)
  return count ?? 0
}

// Member — register the caller (RLS enforces member_id = auth.uid()).
export async function insertOwnRegistration(tournamentId: string, memberId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tournament_registrations')
    .insert({ tournament_id: tournamentId, member_id: memberId })
  if (error) throw error
}

// Member — withdraw the caller.
export async function deleteOwnRegistration(tournamentId: string, memberId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tournament_registrations')
    .delete()
    .eq('tournament_id', tournamentId)
    .eq('member_id', memberId)
  if (error) throw new Error(`deleteOwnRegistration: ${error.message}`)
}

// Admin — add any member to a tournament.
export async function insertRegistrationAdmin(tournamentId: string, memberId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('tournament_registrations')
    .insert({ tournament_id: tournamentId, member_id: memberId })
  if (error) throw error
}

// Admin — remove any registration by id.
export async function deleteRegistrationAdmin(registrationId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('tournament_registrations')
    .delete()
    .eq('id', registrationId)
  if (error) throw new Error(`deleteRegistrationAdmin: ${error.message}`)
}
