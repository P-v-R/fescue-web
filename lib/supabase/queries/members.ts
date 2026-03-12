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
export type DirectoryMember = Pick<Member, 'id' | 'full_name' | 'phone' | 'discord'>

export async function getActiveMembers(): Promise<DirectoryMember[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('members')
    .select('id, full_name, phone, discord')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) throw new Error(`getActiveMembers: ${error.message}`)
  return (data ?? []) as DirectoryMember[]
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
