'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')
  const { data: member } = await supabase.from('members').select('is_admin').eq('id', user.id).single()
  if (!member?.is_admin) throw new Error('Not authorized.')
}

export async function updateMemberSinceAction(
  memberId: string,
  year: number,
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Not authorized.' }
  }

  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear()) {
    return { error: 'Invalid year.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('members')
    .update({ member_since: year })
    .eq('id', memberId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/members/${memberId}`)
  revalidatePath('/members')
  return {}
}
