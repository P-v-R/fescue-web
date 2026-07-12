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
import { createTournamentSchema } from '@/lib/validations/tournament'
import {
  createTournament,
  updateTournament,
  updateTournamentStatus,
  deleteTournament,
  getTournamentById,
} from '@/lib/supabase/queries/tournaments'
import {
  insertRegistrationAdmin,
  deleteRegistrationAdmin,
  getMemberRegistration,
  getRegistrationCount,
  getRegistrationsForTournament,
} from '@/lib/supabase/queries/tournament-registrations'
import {
  insertBracket,
  deleteMatchesForTournament,
  setMatchPlayer,
  setRegistrationSeeds,
} from '@/lib/supabase/queries/tournament-matches'
import { buildBracketRows } from '@/lib/tournament/build-rows'
import type { TournamentRegistrationWithMember } from '@/lib/supabase/types'
import { createResendClient, isResendConfigured, FROM_ADDRESSES } from '@/lib/resend/client'
import { inviteEmailHtml, inviteEmailText } from '@/lib/resend/templates/invite'
import { introEmailHtml, introEmailText } from '@/lib/resend/templates/intro'
import { welcomeEmailHtml, welcomeEmailText } from '@/lib/resend/templates/welcome'
import { tourInviteHtml, tourInviteText, tourInviteIcs } from '@/lib/resend/templates/tour-invite'
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
    const adminId = await requireAdmin()

    const firstName = fullName.split(' ')[0] ?? fullName
    const scheduleUrl = process.env.NEXT_PUBLIC_SCHEDULE_URL ?? 'https://calendly.com/fescuegolfclub'

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

    await updateMembershipRequestStatus(requestId, 'contacted', {
      contacted_by: adminId,
      contacted_at: new Date().toISOString(),
    })
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
    const adminId = await requireAdmin()
    await updateMembershipRequestStatus(requestId, 'contacted', {
      contacted_by: adminId,
      contacted_at: new Date().toISOString(),
    })
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

export async function scheduleTourAction(
  requestId: string,
  prospectEmail: string,
  prospectName: string,
  tourDatetimeLocal: string, // "YYYY-MM-DDTHH:MM" in LA time from datetime-local input
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()

    // Validate format before passing to new Date() — an invalid string would
    // produce Invalid Date and corrupt the ICS or throw inside date-fns.
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(tourDatetimeLocal)) {
      return { error: 'Invalid tour date format.' }
    }
    const tourDate = new Date(tourDatetimeLocal)
    if (isNaN(tourDate.getTime())) {
      return { error: 'Invalid tour date.' }
    }

    const firstName = prospectName.trim().split(/\s+/)[0] || prospectName

    // Format for display: "Wednesday, May 15 at 10:00 AM"
    const tourDateFormatted = format(tourDate, "EEEE, MMMM d 'at' h:mm a")

    const icsContent = tourInviteIcs({ requestId, tourDatetimeLocal, prospectEmail, prospectName })
    const adminEmail = process.env.OWNER_EMAIL

    if (!isResendConfigured()) {
      console.log(`[DEV] Tour invite to ${prospectEmail} for ${tourDateFormatted}`)
      console.log('[DEV] ICS:\n', icsContent)
    } else {
      const resend = createResendClient()
      await resend.emails.send({
        from: FROM_ADDRESSES.hello,
        to: prospectEmail,
        ...(adminEmail ? { cc: adminEmail } : {}),
        ...(process.env.ASST_GM_EMAIL ? { bcc: process.env.ASST_GM_EMAIL } : {}),
        subject: `Fescue Golf Club — Your Visit on ${format(tourDate, 'MMMM d')}`,
        html: tourInviteHtml({ firstName, tourDateFormatted }),
        text: tourInviteText({ firstName, tourDateFormatted }),
        attachments: [
          {
            filename: 'fescue-tour.ics',
            content: Buffer.from(icsContent).toString('base64'),
            contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
          },
        ],
      })
    }

    // Always persist the pipeline status and tour date — even in dev mode.
    // If the email send threw, we'd have returned above via the catch block.
    await updateMembershipRequestStatus(requestId, 'pipeline', {
      tour_date: tourDate.toISOString(),
    })

    revalidatePath('/admin')
    return { success: `Tour invite sent to ${prospectEmail} for ${tourDateFormatted}.` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to send tour invite.' }
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
    let isNewAuthUser = false

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: req.email,
      password: req.password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already registered')) {
        // Find the existing auth user by email — note: perPage: 1000 is sufficient for club scale
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        if (listError) throw new Error(`Failed to look up existing auth user: ${listError.message}`)
        const normalizedEmail = req.email.trim().toLowerCase()
        const existing = (listData?.users ?? []).find((u) => (u.email ?? '').trim().toLowerCase() === normalizedEmail)
        if (!existing) throw new Error(`Auth user already exists for ${req.email} but could not be located.`)
        // Set password so they can sign in via email/password in addition to Google OAuth
        const { error: updateUserError } = await supabase.auth.admin.updateUserById(existing.id, { password: req.password })
        if (updateUserError) throw new Error(`Failed to set password for existing auth user: ${updateUserError.message}`)
        authUser = existing
      } else {
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }
    } else {
      authUser = authData?.user ?? null
      isNewAuthUser = true
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
      // Only roll back if we created the auth user — don't delete a pre-existing OAuth account
      if (isNewAuthUser) await supabase.auth.admin.deleteUser(authUser.id)
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

// ─── Tournament actions ─────────────────────────────────────────────────────────

// Combines a datetime-local string (YYYY-MM-DDTHH:MM) into an ISO timestamp, or
// null when the field is blank.
function optionalDatetimeToIso(value: string | undefined): string | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function parseTournamentForm(formData: FormData) {
  const capacityRaw = (formData.get('capacity') as string | null)?.trim()
  const raw = {
    name: (formData.get('name') as string | null)?.trim() ?? '',
    description: (formData.get('description') as string | null)?.trim() || undefined,
    format: (formData.get('format') as string | null) ?? '',
    capacity: capacityRaw ? Number(capacityRaw) : null,
    registration_closes_at: (formData.get('registration_closes_at') as string | null)?.trim() || undefined,
    starts_at: (formData.get('starts_at') as string | null)?.trim() || undefined,
  }
  return createTournamentSchema.safeParse(raw)
}

export async function createTournamentAction(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const adminId = await requireAdmin()
    const parsed = parseTournamentForm(formData)
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

    await createTournament({
      name: parsed.data.name,
      description: parsed.data.description,
      format: parsed.data.format,
      capacity: parsed.data.capacity ?? null,
      registration_closes_at: optionalDatetimeToIso(parsed.data.registration_closes_at),
      starts_at: optionalDatetimeToIso(parsed.data.starts_at),
      created_by: adminId,
    })

    revalidatePath('/admin')
    revalidatePath('/tournaments')
    return { success: 'Tournament created as a draft.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create tournament.' }
  }
}

export async function updateTournamentAction(
  id: string,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    const parsed = parseTournamentForm(formData)
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

    await updateTournament(id, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      format: parsed.data.format,
      capacity: parsed.data.capacity ?? null,
      registration_closes_at: optionalDatetimeToIso(parsed.data.registration_closes_at),
      starts_at: optionalDatetimeToIso(parsed.data.starts_at),
    })

    revalidatePath('/admin')
    revalidatePath('/tournaments')
    revalidatePath(`/tournaments/match-play/${id}`)
    return { success: 'Tournament updated.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update tournament.' }
  }
}

export async function deleteTournamentAction(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await deleteTournament(id)
    revalidatePath('/admin')
    revalidatePath('/tournaments')
    return { success: 'Tournament deleted.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete tournament.' }
  }
}

// Draft → registration: opens the tournament for member sign-ups.
export async function openRegistrationAction(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    const tournament = await getTournamentById(id)
    if (!tournament) return { error: 'Tournament not found.' }
    if (tournament.status !== 'draft' && tournament.status !== 'seeding') {
      return { error: 'Registration can only be opened from draft or seeding.' }
    }
    await updateTournamentStatus(id, 'registration')
    revalidatePath('/admin')
    revalidatePath('/tournaments')
    revalidatePath(`/tournaments/match-play/${id}`)
    return { success: 'Registration is open.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to open registration.' }
  }
}

// Admin — add any member to a tournament's field.
export async function addParticipantAction(
  tournamentId: string,
  memberId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    const tournament = await getTournamentById(tournamentId)
    if (!tournament) return { error: 'Tournament not found.' }

    const existing = await getMemberRegistration(tournamentId, memberId)
    if (existing) return { error: 'That member is already registered.' }

    if (tournament.capacity != null) {
      const count = await getRegistrationCount(tournamentId)
      if (count >= tournament.capacity) return { error: 'This tournament is full.' }
    }

    await insertRegistrationAdmin(tournamentId, memberId)
    revalidatePath('/admin')
    revalidatePath('/tournaments')
    revalidatePath(`/tournaments/match-play/${tournamentId}`)
    return { success: 'Participant added.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to add participant.' }
  }
}

// Admin — remove a registration by its id.
export async function removeParticipantAction(
  registrationId: string,
  tournamentId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await deleteRegistrationAdmin(registrationId)
    revalidatePath('/admin')
    revalidatePath('/tournaments')
    revalidatePath(`/tournaments/match-play/${tournamentId}`)
    return { success: 'Participant removed.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to remove participant.' }
  }
}

// ─── Bracket / seeding actions ──────────────────────────────────────────────

// Orders registrations by assigned seed (nulls last, then by sign-up order).
function bySeed(a: TournamentRegistrationWithMember, b: TournamentRegistrationWithMember): number {
  if (a.seed != null && b.seed != null) return a.seed - b.seed
  if (a.seed != null) return -1
  if (b.seed != null) return 1
  return a.created_at.localeCompare(b.created_at)
}

// Admin — persist a seed order (called from the seeding UI before generation).
export async function setSeedsAction(
  tournamentId: string,
  orderedRegistrationIds: string[],
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    const tournament = await getTournamentById(tournamentId)
    if (!tournament) return { error: 'Tournament not found.' }
    if (tournament.status !== 'seeding') {
      return { error: 'Seeds can only be changed while seeding.' }
    }
    await setRegistrationSeeds(orderedRegistrationIds.map((id, i) => ({ id, seed: i + 1 })))
    revalidatePath('/admin')
    revalidatePath(`/tournaments/match-play/${tournamentId}`)
    return { success: 'Seeding saved.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save seeding.' }
  }
}

// Admin — draw the bracket from the current field and start play.
export async function generateBracketAction(
  tournamentId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    const tournament = await getTournamentById(tournamentId)
    if (!tournament) return { error: 'Tournament not found.' }
    if (tournament.status !== 'seeding') {
      return { error: 'Close registration before drawing the bracket.' }
    }

    const registrations = await getRegistrationsForTournament(tournamentId)
    if (registrations.length < 2) return { error: 'Need at least 2 registered players.' }

    // Persist the seed order (current order becomes seeds 1..N), then build.
    const ordered = [...registrations].sort(bySeed)
    await setRegistrationSeeds(ordered.map((r, i) => ({ id: r.id, seed: i + 1 })))

    const idByLocal = new Map<number, string>()
    const newId = (localId: number): string => {
      let id = idByLocal.get(localId)
      if (!id) {
        id = crypto.randomUUID()
        idByLocal.set(localId, id)
      }
      return id
    }

    const rows = buildBracketRows({
      tournamentId,
      format: tournament.format,
      orderedRegistrationIds: ordered.map((r) => r.id),
      newId,
    })

    // Regenerating is safe — clear any prior draw first.
    await deleteMatchesForTournament(tournamentId)
    await insertBracket(rows)
    await updateTournamentStatus(tournamentId, 'in_progress')

    revalidatePath('/admin')
    revalidatePath('/tournaments')
    revalidatePath(`/tournaments/match-play/${tournamentId}`)
    return { success: 'Bracket drawn. The tournament is underway.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to draw bracket.' }
  }
}

// Admin — tear down the bracket and return to seeding.
export async function resetBracketAction(
  tournamentId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    const tournament = await getTournamentById(tournamentId)
    if (!tournament) return { error: 'Tournament not found.' }
    if (tournament.status === 'completed') {
      return { error: 'Reopen the tournament before resetting the bracket.' }
    }
    await deleteMatchesForTournament(tournamentId)
    await updateTournamentStatus(tournamentId, 'seeding')
    revalidatePath('/admin')
    revalidatePath('/tournaments')
    revalidatePath(`/tournaments/match-play/${tournamentId}`)
    return { success: 'Bracket cleared. Back to seeding.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to reset bracket.' }
  }
}

// Admin — move a player into a specific match slot (manual correction).
export async function moveMatchPlayerAction(
  matchId: string,
  tournamentId: string,
  slot: 1 | 2,
  registrationId: string | null,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    await setMatchPlayer(matchId, slot, registrationId)
    revalidatePath('/admin')
    revalidatePath(`/tournaments/match-play/${tournamentId}`)
    return { success: 'Player moved.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to move player.' }
  }
}

// Registration → seeding: closes sign-ups ahead of bracket generation.
export async function closeRegistrationAction(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin()
    const tournament = await getTournamentById(id)
    if (!tournament) return { error: 'Tournament not found.' }
    if (tournament.status !== 'registration') {
      return { error: 'Only an open tournament can be closed.' }
    }
    await updateTournamentStatus(id, 'seeding')
    revalidatePath('/admin')
    revalidatePath('/tournaments')
    revalidatePath(`/tournaments/match-play/${id}`)
    return { success: 'Registration closed.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to close registration.' }
  }
}

