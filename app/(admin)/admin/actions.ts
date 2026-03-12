'use server'

import { revalidatePath } from 'next/cache'
import { format, addDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createInvite, deleteInvite, getPendingInvites } from '@/lib/supabase/queries/invites'
import { deactivateMember } from '@/lib/supabase/queries/members'
import { cancelBookingAdmin, getAdminBookingsForDate, createBookingAdmin, type AdminBooking } from '@/lib/supabase/queries/bookings'
import { updateMembershipRequestStatus } from '@/lib/supabase/queries/membership-requests'
import { createBlackoutPeriod, deleteBlackoutPeriod } from '@/lib/supabase/queries/blackout-periods'
import { createResendClient, isResendConfigured, FROM_ADDRESS } from '@/lib/resend/client'
import { inviteEmailHtml, inviteEmailText } from '@/lib/resend/templates/invite'

// ─── Auth guard helper ────────────────────────────────────────────────────────

async function requireAdmin(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data: member } = await supabase
    .from('members')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!member?.is_admin) throw new Error('Not authorized.')
  return user.id
}

async function sendInviteEmail(email: string, token: string, name?: string | null): Promise<void> {
  if (!isResendConfigured()) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    console.log(`[DEV] Invite link for ${name ?? email}: ${appUrl}/invite/${token}`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${token}`
  const expiresAt = format(addDays(new Date(), 30), 'MMMM d, yyyy')

  const resend = createResendClient()
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: 'Your Fescue Golf Club Invitation',
    html: inviteEmailHtml({ inviteUrl, recipientEmail: email, recipientName: name, expiresAt }),
    text: inviteEmailText({ inviteUrl, recipientEmail: email, recipientName: name, expiresAt }),
  })
}

// ─── Invite actions ───────────────────────────────────────────────────────────

export async function sendInviteAction(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const adminId = await requireAdmin()
    const email = (formData.get('email') as string | null)?.trim()
    const name = (formData.get('name') as string | null)?.trim() || undefined

    if (!email || !email.includes('@')) {
      return { error: 'Please enter a valid email address.' }
    }

    const invite = await createInvite(email, adminId, name)
    await sendInviteEmail(email, invite.token, name)

    revalidatePath('/admin')
    return { success: `Invitation sent to ${name ? `${name} (${email})` : email}.` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to send invite.' }
  }
}

export async function rescindInviteAction(
  inviteId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await deleteInvite(inviteId)
    revalidatePath('/admin')
    return { success: 'Invitation rescinded.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to rescind invite.' }
  }
}

export async function resendInviteAction(
  inviteId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()

    const supabase = createAdminClient()
    const { data: invite, error } = await supabase
      .from('invites')
      .select('*')
      .eq('id', inviteId)
      .single()

    if (error || !invite) return { error: 'Invite not found.' }
    if (invite.accepted_at) return { error: 'This invite has already been accepted.' }

    await sendInviteEmail(invite.email, invite.token, invite.name)
    return { success: `Invitation resent to ${invite.email}.` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to resend invite.' }
  }
}

// ─── Member actions ───────────────────────────────────────────────────────────

export async function deactivateMemberAction(
  memberId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await deactivateMember(memberId)
    revalidatePath('/admin')
    return { success: 'Member deactivated.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to deactivate member.' }
  }
}

// ─── Booking actions ──────────────────────────────────────────────────────────

export async function getBookingsForDateAction(
  dateStr: string,
): Promise<{ error?: string; bookings?: AdminBooking[] }> {
  try {
    await requireAdmin()
    const date = new Date(dateStr + 'T12:00:00')
    const bookings = await getAdminBookingsForDate(date)
    return { bookings }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to load bookings.' }
  }
}

export async function cancelBookingAdminAction(
  bookingId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await cancelBookingAdmin(bookingId)
    revalidatePath('/admin')
    return { success: 'Booking cancelled.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to cancel booking.' }
  }
}

// ─── Membership request actions ───────────────────────────────────────────────

export async function inviteFromRequestAction(
  requestId: string,
  email: string,
): Promise<{ error?: string; success?: string }> {
  try {
    const adminId = await requireAdmin()

    // Create invite
    const invite = await createInvite(email, adminId)
    await sendInviteEmail(email, invite.token)

    // Mark request as invited
    await updateMembershipRequestStatus(requestId, 'invited')

    revalidatePath('/admin')
    return { success: `Invitation sent to ${email}.` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to send invite.' }
  }
}

// ─── Blackout period actions ──────────────────────────────────────────────────

export async function createBlackoutAction(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const adminId = await requireAdmin()
    const date = (formData.get('date') as string | null)?.trim()
    const allDay = formData.get('all_day') === 'true'
    const allBays = formData.get('all_bays') === 'true'
    const startTime = allDay ? null : (formData.get('start_time') as string | null) || null
    const endTime = allDay ? null : (formData.get('end_time') as string | null) || null
    const bayIds = allBays ? [] : JSON.parse((formData.get('bay_ids') as string) || '[]') as string[]
    const reason = (formData.get('reason') as string | null)?.trim() || null

    if (!date) return { error: 'Please select a date.' }
    if (!allBays && bayIds.length === 0) return { error: 'Select at least one bay.' }
    if (!allDay && (!startTime || !endTime)) return { error: 'Please set both start and end time.' }
    if (!allDay && startTime! >= endTime!) return { error: 'End time must be after start time.' }

    await createBlackoutPeriod({ date, start_time: startTime, end_time: endTime, all_bays: allBays, bay_ids: bayIds, reason, created_by: adminId })
    revalidatePath('/admin')
    revalidatePath('/reservations')
    return { success: 'Blackout period saved.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create blackout.' }
  }
}

export async function deleteBlackoutAction(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await deleteBlackoutPeriod(id)
    revalidatePath('/admin')
    revalidatePath('/reservations')
    return { success: 'Blackout period removed.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to remove blackout.' }
  }
}

// ─── Book on behalf of member ─────────────────────────────────────────────────

export async function createBookingForMemberAction(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    const memberId = formData.get('member_id') as string | null
    const bayId = formData.get('bay_id') as string | null
    const startTime = formData.get('start_time') as string | null
    const durationRaw = formData.get('duration_minutes')
    const duration = durationRaw ? parseInt(durationRaw as string, 10) : null

    if (!memberId || !bayId || !startTime || !duration) {
      return { error: 'All fields are required.' }
    }
    if (![60, 90, 120].includes(duration)) {
      return { error: 'Invalid duration.' }
    }

    await createBookingAdmin({
      member_id: memberId,
      bay_id: bayId,
      start_time: startTime,
      duration_minutes: duration as 60 | 90 | 120,
      guests: [],
    })

    revalidatePath('/admin')
    revalidatePath(`/admin/members/${memberId}`)
    return { success: 'Booking created.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create booking.' }
  }
}

export async function declineRequestAction(
  requestId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await updateMembershipRequestStatus(requestId, 'declined')
    revalidatePath('/admin')
    return { success: 'Request declined.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to decline request.' }
  }
}
