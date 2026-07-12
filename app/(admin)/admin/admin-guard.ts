import { createClient } from '@/lib/supabase/server'

// Throws unless the caller is an active admin. Returns the admin's user id.
// Plain module (not "use server") so it can be imported by server-action files.
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data: member } = await supabase
    .from('members')
    .select('is_admin, is_active')
    .eq('id', user.id)
    .single()

  if (!member?.is_admin || !member?.is_active) throw new Error('Not authorized.')
  return user.id
}
