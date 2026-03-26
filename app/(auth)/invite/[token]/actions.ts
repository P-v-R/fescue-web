'use server'

import { redirect } from 'next/navigation'
import { acceptInvite } from '@/lib/supabase/queries/invites'
import { acceptInviteSchema } from '@/lib/validations/auth'
import type { AcceptInviteInput } from '@/lib/validations/auth'

export async function acceptInviteAction(
  token: string,
  input: AcceptInviteInput,
): Promise<{ error: string } | never> {
  const parsed = acceptInviteSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Invalid input.' }
  }

  try {
    await acceptInvite(token, {
      full_name: parsed.data.full_name,
      password: parsed.data.password,
      phone: parsed.data.phone,
      discord: parsed.data.discord,
      member_since: parsed.data.member_since,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
    return { error: message }
  }

  redirect('/dashboard')
}
