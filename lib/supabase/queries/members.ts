import { createClient } from '../server'
import { createAdminClient } from '../admin'
import type { Member } from '../types'

// Admin only — returns all members ordered by join date.
export async function getAllMembers(): Promise<Member[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getAllMembers: ${error.message}`)
  return (data ?? []) as Member[]
}

// Active members directory — readable by any authenticated member.
export type DirectoryMember = Pick<Member, 'id' | 'full_name' | 'phone' | 'discord' | 'member_since' | 'created_at'>

export async function getActiveMembers(): Promise<DirectoryMember[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('members')
    .select('id, full_name, phone, discord, member_since, created_at')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) throw new Error(`getActiveMembers: ${error.message}`)
  return (data ?? []) as DirectoryMember[]
}

// Admin only — active member emails for bulk copy.
export async function getActiveMemberEmails(): Promise<string[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('members')
    .select('email')
    .eq('is_active', true)
    .order('full_name', { ascending: true })
  if (error) throw new Error(`getActiveMemberEmails: ${error.message}`)
  return (data ?? []).map((r) => r.email).filter(Boolean)
}

// Admin only — single member by ID with all fields.
export async function getMemberById(id: string): Promise<Member | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Member
}

// Returns a map of lowercase sgt_username → full_name for all active members.
// Used to annotate tournament leaderboards with real names.
export async function getMemberNamesBySgtUsername(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('members')
    .select('full_name, sgt_username')
    .eq('is_active', true)
    .not('sgt_username', 'is', null)
  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.sgt_username) map[row.sgt_username.toLowerCase()] = row.full_name
  }
  return map
}

// Admin only — deactivate a member and sign them out.
export async function deactivateMember(memberId: string): Promise<void> {
  const supabase = createAdminClient()

  const { error: updateError } = await supabase
    .from('members')
    .update({ is_active: false })
    .eq('id', memberId)

  if (updateError) throw new Error(`deactivateMember update: ${updateError.message}`)

  // Force sign out all sessions for this user
  const { error: signOutError } = await supabase.auth.admin.signOut(memberId)
  if (signOutError) throw new Error(`deactivateMember signOut: ${signOutError.message}`)
}
