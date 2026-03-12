import { createClient as createServerClient } from '../server'
import type { MembershipRequest } from '../types'

// Admin only — returns all membership requests ordered by date.
export async function getMembershipRequests(): Promise<MembershipRequest[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('membership_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getMembershipRequests: ${error.message}`)
  return (data ?? []) as MembershipRequest[]
}

// Public — anyone can submit a membership request from /membership.
export async function createMembershipRequest(
  fullName: string,
  email: string,
  message?: string,
): Promise<MembershipRequest> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('membership_requests')
    .insert({ full_name: fullName, email, message: message ?? null })
    .select()
    .single()

  if (error) throw new Error(`createMembershipRequest: ${error.message}`)
  return data as MembershipRequest
}

// Admin only — update request status.
export async function updateMembershipRequestStatus(
  id: string,
  status: 'invited' | 'declined',
): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('membership_requests')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(`updateMembershipRequestStatus: ${error.message}`)
}
