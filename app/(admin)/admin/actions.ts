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
import { createEvent, updateEvent, deleteEvent, getEventById } from '@/lib/supabase/queries/events'
import { deleteRsvpAdmin } from '@/lib/supabase/queries/event-rsvps'
import { getJoinRequestForApproval, markJoinRequestApproved, markJoinRequestDeclined } from '@/lib/supabase/queries/join-requests'
import { createEventSchema } from '@/lib/validations/event'
import { createResendClient, isResendConfigured, FROM_ADDRESSES } from '@/lib/resend/client'
import { inviteEmailHtml, inviteEmailText } from '@/lib/resend/templates/invite'
import { introEmailHtml, introEmailText } from '@/lib/resend/templates/intro'
import { welcomeEmailHtml, welcomeEmailText } from '@/lib/resend/templates/welcome'
import { notifyNewEvent } from '@/lib/discord/notify'

// ─── Auth guard helper ────────────────────────────────────────────────────────

async function requireAdmin(): Promise<string> {
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
    from: FROM_ADDRESSES.noreply,
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
    const rawBayIds = allBays ? [] : JSON.parse((formData.get('bay_ids') as string) || '[]') as unknown[]
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const bayIds = rawBayIds.filter((id): id is string => typeof id === 'string' && uuidRegex.test(id))
    const reason = (formData.get('reason') as string | null)?.trim() || null

    if (!date) return { error: 'Please select a date.' }
    if (!allBays && bayIds.length === 0) return { error: 'Select at least one bay.' }
    if (!allDay && (!startTime || !endTime)) return { error: 'Please set both start and end time.' }
    if (!allDay && startTime! >= endTime!) return { error: 'End time must be after start time.' }

    await createBlackoutPeriod({ date, start_time: startTime, end_time: endTime, all_bays: allBays, bay_ids: bayIds, reason, created_by: adminId })

    const addToCalendar = formData.get('add_to_calendar') === 'true'
    if (addToCalendar) {
      const eventTitle = (formData.get('calendar_event_title') as string | null)?.trim() || reason || 'Bay Unavailable'
      const eventDescription = (formData.get('calendar_event_description') as string | null)?.trim() || undefined
      const startsAt = allDay ? `${date}T08:00:00` : `${date}T${startTime}`
      const endsAt = allDay ? `${date}T22:00:00` : `${date}T${endTime}`
      await createEvent({
        title: eventTitle,
        description: eventDescription,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        rsvp_enabled: false,
        created_by: adminId,
      })
      revalidatePath('/calendar')
    }

    revalidatePath('/admin')
    revalidatePath('/reservations')
    return { success: addToCalendar ? 'Blackout period saved and added to calendar.' : 'Blackout period saved.' }
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
    if (duration <= 0 || duration % 30 !== 0 || duration > 840) {
      return { error: 'Invalid duration.' }
    }

    await createBookingAdmin({
      member_id: memberId,
      bay_id: bayId,
      start_time: startTime,
      duration_minutes: duration,
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

export async function sendIntroEmailAction(
  requestId: string,
  email: string,
  fullName: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()

    const firstName = fullName.split(' ')[0] ?? fullName
    const scheduleUrl = process.env.NEXT_PUBLIC_SCHEDULE_URL ?? 'https://calendly.com/fescuegolfclub'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    void appUrl

    if (!isResendConfigured()) {
      console.log(`[DEV] Intro email to ${email} (${firstName}) — schedule: ${scheduleUrl}`)
    } else {
      const resend = createResendClient()
      await resend.emails.send({
        from: FROM_ADDRESSES.noreply,
        to: email,
        subject: 'Thanks for your interest in Fescue Golf Club',
        html: introEmailHtml({ firstName, scheduleUrl }),
        text: introEmailText({ firstName, scheduleUrl }),
      })
    }

    await updateMembershipRequestStatus(requestId, 'contacted')
    revalidatePath('/admin')
    return { success: `Intro email sent to ${email}.` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to send intro email.' }
  }
}

export async function markContactedAction(
  requestId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await updateMembershipRequestStatus(requestId, 'contacted')
    revalidatePath('/admin')
    return { success: 'Marked as contacted.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update request.' }
  }
}

export async function sendGuestIntroEmailAction(
  email: string,
  fullName: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()

    const firstName = fullName.split(' ')[0] ?? fullName
    const scheduleUrl = process.env.NEXT_PUBLIC_SCHEDULE_URL ?? 'https://calendly.com/fescuegolfclub'

    if (!isResendConfigured()) {
      console.log(`[DEV] Guest intro email to ${email} (${firstName}) — schedule: ${scheduleUrl}`)
    } else {
      const resend = createResendClient()
      await resend.emails.send({
        from: FROM_ADDRESSES.noreply,
        to: email,
        subject: 'Thanks for your interest in Fescue Golf Club',
        html: introEmailHtml({ firstName, scheduleUrl }),
        text: introEmailText({ firstName, scheduleUrl }),
      })
    }

    return { success: `Intro email sent to ${email}.` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to send intro email.' }
  }
}

export async function markPendingAction(
  requestId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await updateMembershipRequestStatus(requestId, 'pending')
    revalidatePath('/admin')
    return { success: 'Moved back to pending.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update request.' }
  }
}

// ─── Join request actions ─────────────────────────────────────────────────────

export async function approveJoinRequestAction(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()

    // 1. Fetch and decrypt (does not modify the record)
    const req = await getJoinRequestForApproval(id)

    const supabase = createAdminClient()

    // 2. Create Supabase auth user with the member's chosen password.
    // If an auth user already exists (e.g. signed up via Google OAuth before approval),
    // reuse that account rather than failing.
    let authUser: { id: string } | null = null

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: req.email,
      password: req.password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already registered')) {
        // Find the existing auth user by email
        const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        const existing = users.find((u) => u.email === req.email)
        if (!existing) throw new Error(`Auth user already exists for ${req.email} but could not be located.`)
        authUser = existing
      } else {
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }
    } else {
      authUser = authData.user
    }

    if (!authUser) throw new Error('Auth user creation returned no user.')

    // 3. Insert member row
    const { error: memberError } = await supabase.from('members').insert({
      id: authUser.id,
      email: req.email,
      full_name: req.full_name,
      phone: req.phone,
      discord: req.discord,
      sgt_username: req.sgt_username,
      member_since: req.member_since,
    })

    if (memberError) {
      // Roll back auth user on member insert failure
      await supabase.auth.admin.deleteUser(authUser.id)
      throw new Error(`Failed to create member profile: ${memberError.message}`)
    }

    // 4. Mark approved + wipe encrypted password
    await markJoinRequestApproved(id)

    // 5. Send welcome email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const loginUrl = `${appUrl}/login`

    if (!isResendConfigured()) {
      console.log(`[DEV] Welcome email → ${req.email} — login: ${loginUrl}`)
    } else {
      const resend = createResendClient()
      await resend.emails.send({
        from: FROM_ADDRESSES.noreply,
        to: req.email,
        subject: "You're in — Fescue Golf Club",
        html: welcomeEmailHtml({ loginUrl, recipientName: req.full_name }),
        text: welcomeEmailText({ loginUrl, recipientName: req.full_name }),
      })
    }

    revalidatePath('/admin')
    return { success: `Account created and welcome email sent to ${req.full_name}.` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to approve request.' }
  }
}

export async function declineJoinRequestAction(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await markJoinRequestDeclined(id)
    revalidatePath('/admin')
    return { success: 'Request declined.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to decline request.' }
  }
}

// ─── Event actions ────────────────────────────────────────────────────────────

// Combines a datetime-local string (YYYY-MM-DDTHH:MM) with a time-only string
// (HH:MM) so that ends_at is always on the same calendar day as starts_at.
function combineDateAndTime(dateTimeLocal: string, timeOnly: string): string {
  const datePart = dateTimeLocal.slice(0, 10) // YYYY-MM-DD
  return new Date(`${datePart}T${timeOnly}`).toISOString()
}

export async function createEventAction(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const adminId = await requireAdmin()

    const raw = {
      title: (formData.get('title') as string | null)?.trim() ?? '',
      description: (formData.get('description') as string | null)?.trim() || undefined,
      starts_at: (formData.get('starts_at') as string | null) ?? '',
      ends_at: (formData.get('ends_at') as string | null)?.trim() || undefined,
      location: (formData.get('location') as string | null)?.trim() || undefined,
      image_url: (formData.get('image_url') as string | null)?.trim() || undefined,
      rsvp_enabled: formData.get('rsvp_enabled') === 'true',
    }

    const parsed = createEventSchema.safeParse(raw)
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

    const startsAtIso = new Date(parsed.data.starts_at).toISOString()
    const endsAtIso = parsed.data.ends_at
      ? combineDateAndTime(parsed.data.starts_at, parsed.data.ends_at)
      : undefined

    await createEvent({
      ...parsed.data,
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      created_by: adminId,
    })

    revalidatePath('/admin')
    revalidatePath('/calendar')
    revalidatePath('/dashboard')
    return { success: 'Event created.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create event.' }
  }
}

export async function updateEventAction(
  id: string,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()

    const raw = {
      title: (formData.get('title') as string | null)?.trim() ?? '',
      description: (formData.get('description') as string | null)?.trim() || undefined,
      starts_at: (formData.get('starts_at') as string | null) ?? '',
      ends_at: (formData.get('ends_at') as string | null)?.trim() || undefined,
      location: (formData.get('location') as string | null)?.trim() || undefined,
      image_url: (formData.get('image_url') as string | null)?.trim() || undefined,
      rsvp_enabled: formData.get('rsvp_enabled') === 'true',
    }

    const parsed = createEventSchema.safeParse(raw)
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

    const startsAtIso = new Date(parsed.data.starts_at).toISOString()
    const endsAtIso = parsed.data.ends_at
      ? combineDateAndTime(parsed.data.starts_at, parsed.data.ends_at)
      : undefined

    await updateEvent(id, {
      ...parsed.data,
      starts_at: startsAtIso,
      ends_at: endsAtIso,
    })

    revalidatePath('/admin')
    revalidatePath('/calendar')
    revalidatePath('/dashboard')
    return { success: 'Event updated.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update event.' }
  }
}

export async function deleteEventAction(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await deleteEvent(id)
    revalidatePath('/admin')
    revalidatePath('/calendar')
    revalidatePath('/dashboard')
    return { success: 'Event deleted.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete event.' }
  }
}

export async function notifyEventAction(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    const event = await getEventById(id)
    if (!event) return { error: 'Event not found.' }
    await notifyNewEvent({
      id: event.id,
      title: event.title,
      description: event.description ?? undefined,
      starts_at: event.starts_at,
      ends_at: event.ends_at ?? undefined,
      location: event.location ?? undefined,
      rsvp_enabled: event.rsvp_enabled,
    })
    return { success: 'Sent to Discord.' }
  } catch (err) {
    console.error('[discord] notifyEventAction failed:', err)
    return { error: 'Failed to post to Discord. Check server logs.' }
  }
}

export async function removeRsvpAction(
  eventId: string,
  memberId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await deleteRsvpAdmin(eventId, memberId)
    revalidatePath('/admin')
    return { success: 'RSVP removed.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to remove RSVP.' }
  }
}

