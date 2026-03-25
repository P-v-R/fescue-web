import { createAdminClient } from '../admin'
import { decryptPassword } from '@/lib/utils/crypto'
import type { JoinRequest } from '../types'

// Admin only — all pending, approved, and declined join requests.
export async function getJoinRequests(): Promise<JoinRequest[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('join_requests')
    .select('id, full_name, email, phone, discord, status, reviewed_at, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getJoinRequests: ${error.message}`)
  return (data ?? []) as JoinRequest[]
}

// Public — create a new pending join request via admin client (bypasses RLS).
export async function createJoinRequest(params: {
  full_name: string
  email: string
  phone?: string | null
  discord?: string | null
  encrypted_password: string
}): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('join_requests').insert({
    full_name: params.full_name,
    email: params.email.toLowerCase().trim(),
    phone: params.phone?.trim() || null,
    discord: params.discord?.trim() || null,
    encrypted_password: params.encrypted_password,
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        'A pending request already exists for this email address. Check your inbox or contact us.',
      )
    }
    throw new Error(`createJoinRequest: ${error.message}`)
  }
}

// Fetch a pending request and decrypt its password for approval.
// Does NOT modify the record — call markJoinRequestApproved after account creation succeeds.
export async function getJoinRequestForApproval(id: string): Promise<{
  id: string
  email: string
  full_name: string
  phone: string | null
  discord: string | null
  password: string
}> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('join_requests')
    .select('id, email, full_name, phone, discord, encrypted_password, status')
    .eq('id', id)
    .single()

  if (error || !data) throw new Error('Join request not found.')
  if (data.status !== 'pending') throw new Error('This request has already been reviewed.')
  if (!data.encrypted_password) throw new Error('Password data is missing — request may be corrupt.')

  const password = decryptPassword(data.encrypted_password as string)

  return {
    id: data.id as string,
    email: data.email as string,
    full_name: data.full_name as string,
    phone: (data.phone as string | null) ?? null,
    discord: (data.discord as string | null) ?? null,
    password,
  }
}

export async function markJoinRequestApproved(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('join_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), encrypted_password: null })
    .eq('id', id)
  if (error) throw new Error(`markJoinRequestApproved: ${error.message}`)
}

export async function markJoinRequestDeclined(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('join_requests')
    .update({ status: 'declined', reviewed_at: new Date().toISOString(), encrypted_password: null })
    .eq('id', id)
  if (error) throw new Error(`markJoinRequestDeclined: ${error.message}`)
}
