import { createAdminClient } from '../admin'
import type { Invite, Member, NewMember } from '../types'

// Admin only — pending invites (not yet accepted).
export async function getPendingInvites(): Promise<Invite[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .is('accepted_at', null)
    .order('sent_at', { ascending: false })

  if (error) throw new Error(`getPendingInvites: ${error.message}`)
  return (data ?? []) as Invite[]
}

// Create an invite record. Rejects if a pending invite already exists for this email.
export async function createInvite(email: string, invitedBy: string, name?: string): Promise<Invite> {
  const supabase = createAdminClient()

  // Duplicate check — block if a pending (unaccepted) invite exists
  const { data: existing } = await supabase
    .from('invites')
    .select('id')
    .eq('email', email)
    .is('accepted_at', null)
    .limit(1)
    .single()

  if (existing) {
    throw new Error(`A pending invitation already exists for ${email}. Rescind it first to re-invite.`)
  }

  const { data, error } = await supabase
    .from('invites')
    .insert({ email, name: name ?? null, invited_by: invitedBy })
    .select()
    .single()

  if (error) throw new Error(`createInvite: ${error.message}`)
  return data as Invite
}

// Delete (rescind) a pending invite.
export async function deleteInvite(id: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('invites')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`deleteInvite: ${error.message}`)
}

// Look up an invite by token. Uses admin client so it works before a session exists.
export async function getInviteByToken(token: string): Promise<Invite | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`getInviteByToken: ${error.message}`)
  }

  return data as Invite
}

// Accept an invite: create auth user, insert member row, mark invite accepted.
// Must run server-side with admin client — never expose service role to browser.
// Email comes from the invite record — the form only collects full_name + password.
export async function acceptInvite(
  token: string,
  memberData: Pick<NewMember, 'full_name' | 'password'> & { phone?: string; discord?: string },
): Promise<Member> {
  const supabase = createAdminClient()

  // 1. Fetch and validate the invite
  const invite = await getInviteByToken(token)
  if (!invite) throw new Error('Invite not found.')
  if (invite.accepted_at) throw new Error('This invite has already been used.')
  if (new Date(invite.expires_at) < new Date()) throw new Error('This invite has expired.')

  // 2. Create the Supabase auth user — use email from invite, not user input
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: invite.email,
    password: memberData.password,
    email_confirm: true, // skip email verification since they came via invite link
  })

  if (authError) throw new Error(`acceptInvite auth: ${authError.message}`)
  const authUser = authData.user
  if (!authUser) throw new Error('Failed to create auth user.')

  // 3. Insert member profile
  const { data: member, error: memberError } = await supabase
    .from('members')
    .insert({
      id: authUser.id,
      email: invite.email,
      full_name: memberData.full_name,
      phone: memberData.phone?.trim() || null,
      discord: memberData.discord?.trim() || null,
      member_since: new Date().getFullYear(),
    })
    .select()
    .single()

  if (memberError) {
    // Roll back auth user creation on failure
    await supabase.auth.admin.deleteUser(authUser.id)
    throw new Error(`acceptInvite member insert: ${memberError.message}`)
  }

  // 4. Mark invite as accepted
  await supabase
    .from('invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token)

  return member as Member
}
