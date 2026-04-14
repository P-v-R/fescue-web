'use server'

import { membershipRequestSchema } from '@/lib/validations/membership-request'
import {
  createMembershipRequest,
  getMembershipRequestByEmailAdmin,
} from '@/lib/supabase/queries/membership-requests'
import { createResendClient, isResendConfigured, FROM_ADDRESSES } from '@/lib/resend/client'
import { membershipNotificationEmail } from '@/lib/resend/templates/membership-notification'

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'sean@fescuegolfclub.com'

export async function submitMembershipRequestAction(
  input: unknown,
): Promise<{ error?: string; success?: string; duplicate?: boolean }> {
  const parsed = membershipRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const {
    full_name,
    email,
    phone,
    zip_code,
    profession,
    referral_source,
    has_membership_org,
    membership_org_names,
    message,
    sgt_username,
  } = parsed.data
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
      full_name: full_name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      zip_code: zip_code?.trim() || undefined,
      profession: profession.trim(),
      referral_source: referral_source.trim(),
      has_membership_org,
      membership_org_names: membership_org_names?.trim() || undefined,
      message: message?.trim() || undefined,
      sgt_username: sgt_username?.trim() || undefined,
    })

    // Notify Sean of the new inquiry — fire and forget, don't block the response
    if (isResendConfigured()) {
      const resend = createResendClient()
      const { subject, html } = membershipNotificationEmail({
        full_name: full_name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        profession: profession.trim(),
        referral_source: referral_source.trim(),
        message: message?.trim(),
      })
      resend.emails.send({
        from: FROM_ADDRESSES.noreply,
        to: OWNER_EMAIL,
        subject,
        html,
      }).catch((err) => console.error('[membership notification]', err))
    }

    return { success: "Thank you — we'll be in touch soon." }
  } catch (err) {
    console.error('[submitMembershipRequestAction]', err)
    return {
      error: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
    }
  }
}
