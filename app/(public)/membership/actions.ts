'use server'

import { membershipRequestSchema } from '@/lib/validations/membership-request'
import {
  createMembershipRequest,
  getMembershipRequestByEmailAdmin,
} from '@/lib/supabase/queries/membership-requests'

export async function submitMembershipRequestAction(
  input: unknown,
): Promise<{ error?: string; success?: string; duplicate?: boolean }> {
  const parsed = membershipRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { first_name, last_name, email, phone, referral_source, message } = parsed.data
  const full_name = `${first_name.trim()} ${last_name.trim()}`
  const normalizedEmail = email.toLowerCase().trim()

  try {
    const existing = await getMembershipRequestByEmailAdmin(normalizedEmail)
    if (existing) {
      return {
        success: "We already have your request on file — we'll be in touch soon.",
        duplicate: true,
      }
    }

    await createMembershipRequest({
      full_name,
      email: normalizedEmail,
      phone: phone?.trim() || undefined,
      referral_source: referral_source?.trim() || undefined,
      message: message?.trim() || undefined,
    })
    return { success: "Thank you — we'll be in touch soon to schedule your tour." }
  } catch (err) {
    console.error('[submitMembershipRequestAction]', err)
    return {
      error: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
    }
  }
}
