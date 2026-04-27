import { createClient as createServerClient } from '../server'
import { createAdminClient } from '../admin'
import type { MembershipRequest } from '../types'

// Admin only — returns all membership requests ordered by date.
export async function getMembershipRequests(): Promise<MembershipRequest[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('membership_requests')
    .select('*, contacted_by_member:members!contacted_by(full_name)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getMembershipRequests: ${error.message}`)
  return (data ?? []) as MembershipRequest[]
}

// Public — anyone can submit a membership request from /contact.
// Uses admin client to bypass RLS — the server action is the trust boundary.
export async function createMembershipRequest(params: {
  full_name: string
  email: string
  phone: string
  zip_code?: string
  profession: string
  referral_source: string
  has_membership_org?: boolean
  membership_org_names?: string
  message?: string
  sgt_username?: string
}): Promise<MembershipRequest> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('membership_requests')
    .insert({
      full_name: params.full_name,
      email: params.email,
      phone: params.phone,
      zip_code: params.zip_code ?? null,
      profession: params.profession,
      referral_source: params.referral_source,
      has_membership_org: params.has_membership_org ?? null,
      membership_org_names: params.membership_org_names ?? null,
      message: params.message ?? null,
      sgt_username: params.sgt_username ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`createMembershipRequest: ${error.message}`)
  return data as MembershipRequest
}

// Admin only — check for existing active request by email (uses admin client to bypass RLS).
export async function getMembershipRequestByEmailAdmin(
  email: string,
): Promise<MembershipRequest | null> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('membership_requests')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .not('status', 'in', '("declined","onboarded")')
    .limit(1)
    .maybeSingle()

  return (data as MembershipRequest | null) ?? null
}

// Admin only — update request status.
export async function updateMembershipRequestStatus(
  id: string,
  status: 'pending' | 'contacted' | 'invited' | 'declined' | 'onboarded',
  meta?: { contacted_by?: string; contacted_at?: string },
): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('membership_requests')
    .update({ status, ...meta })
    .eq('id', id)

  if (error) throw new Error(`updateMembershipRequestStatus: ${error.message}`)
}
