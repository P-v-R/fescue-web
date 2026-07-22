import { createClient } from '../server'
import { createAdminClient } from '../admin'
import type { Tournament, TournamentStatus } from '../types'

export type CreateTournamentData = {
  name: string
  description?: string | null
  format: Tournament['format']
  capacity?: number | null
  registration_closes_at?: string | null
  starts_at?: string | null
  created_by?: string | null
}

export type UpdateTournamentData = Partial<Omit<CreateTournamentData, 'created_by'>>

// Member-facing — all tournaments except drafts, newest first.
export async function getTournaments(): Promise<Tournament[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`getTournaments: ${error.message}`)
  return (data ?? []) as Tournament[]
}

// Member-facing — single tournament by ID (RLS still hides nothing but drafts are fine to view via link).
export async function getTournamentById(id: string): Promise<Tournament | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('tournaments').select('*').eq('id', id).single()
  if (error) return null
  return data as Tournament
}

// Admin — every tournament including drafts.
export async function getAllTournaments(): Promise<Tournament[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`getAllTournaments: ${error.message}`)
  return (data ?? []) as Tournament[]
}

export async function createTournament(data: CreateTournamentData): Promise<Tournament> {
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('tournaments')
    .insert({
      name: data.name,
      description: data.description || null,
      format: data.format,
      capacity: data.capacity ?? null,
      registration_closes_at: data.registration_closes_at || null,
      starts_at: data.starts_at || null,
      created_by: data.created_by || null,
    })
    .select()
    .single()
  if (error) throw new Error(`createTournament: ${error.message}`)
  return row as Tournament
}

export async function updateTournament(id: string, data: UpdateTournamentData): Promise<Tournament> {
  const supabase = createAdminClient()
  const patch: Record<string, unknown> = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.description !== undefined) patch.description = data.description || null
  if (data.format !== undefined) patch.format = data.format
  if (data.capacity !== undefined) patch.capacity = data.capacity ?? null
  if (data.registration_closes_at !== undefined) patch.registration_closes_at = data.registration_closes_at || null
  if (data.starts_at !== undefined) patch.starts_at = data.starts_at || null

  const { data: row, error } = await supabase
    .from('tournaments')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(`updateTournament: ${error.message}`)
  return row as Tournament
}

export async function updateTournamentStatus(id: string, status: TournamentStatus): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('tournaments').update({ status }).eq('id', id)
  if (error) throw new Error(`updateTournamentStatus: ${error.message}`)
}

export async function deleteTournament(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('tournaments').delete().eq('id', id)
  if (error) throw new Error(`deleteTournament: ${error.message}`)
}

export async function setTournamentSgtTour(id: string, sgtTourId: number): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('tournaments').update({ sgt_tour_id: sgtTourId }).eq('id', id)
  if (error) throw new Error(`setTournamentSgtTour: ${error.message}`)
}

// Crown the champion and close out the tournament.
export async function setTournamentChampion(id: string, registrationId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('tournaments')
    .update({ champion_registration_id: registrationId, status: 'completed' })
    .eq('id', id)
  if (error) throw new Error(`setTournamentChampion: ${error.message}`)
}
