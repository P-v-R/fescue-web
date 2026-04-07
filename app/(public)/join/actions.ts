'use server'

import { joinRequestSchema, type JoinRequestInput } from '@/lib/validations/join-request'
import { createJoinRequest } from '@/lib/supabase/queries/join-requests'
import { encryptPassword } from '@/lib/utils/crypto'

export async function submitJoinRequestAction(
  input: JoinRequestInput,
): Promise<{ error?: string }> {
  const parsed = joinRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { full_name, email, phone, discord, member_since, password } = parsed.data

  try {
    const encrypted_password = encryptPassword(password)

    await createJoinRequest({
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      discord: discord?.trim() || null,
      member_since,
      encrypted_password,
    })

    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to submit request.' }
  }
}
