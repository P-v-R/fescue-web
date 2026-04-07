'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createBooking, cancelBooking } from '@/lib/supabase/queries/bookings'
import { getUpcomingBlackoutPeriods, findBlackout } from '@/lib/supabase/queries/blackout-periods'
import { newBookingSchema } from '@/lib/validations/booking'
import { isWithinOperatingHours } from '@/lib/utils/time-slots'
import { createResendClient, isResendConfigured, FROM_ADDRESSES } from '@/lib/resend/client'
import { bookingConfirmationHtml, bookingConfirmationText } from '@/lib/resend/templates/booking-confirmation'
import type { Booking } from '@/lib/supabase/types'
import type { NewBookingInput } from '@/lib/validations/booking'

type CreateBookingResult = { error: string } | { booking: Booking }

export async function createBookingAction(input: NewBookingInput): Promise<CreateBookingResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in to book a bay.' }

  const parsed = newBookingSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { bay_id, start_time, duration_minutes, guests } = parsed.data

  const startTime = new Date(start_time)

  if (isNaN(startTime.getTime())) return { error: 'Invalid start time.' }

  // Must be in the future
  if (startTime <= new Date()) {
    return { error: 'Cannot book a slot in the past.' }
  }

  // Max 1 month in advance
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 1)
  if (startTime > maxDate) {
    return { error: 'Bookings can only be made up to one month in advance.' }
  }

  // End time must not exceed 10pm
  if (!isWithinOperatingHours(startTime, duration_minutes)) {
    return {
      error: 'This booking would end after 10pm. Choose a shorter duration or earlier start time.',
    }
  }

  // Blackout period check — server-side enforcement
  const blackouts = await getUpcomingBlackoutPeriods()
  const blackout = findBlackout(startTime, bay_id, blackouts)
  if (blackout) {
    return { error: `This time is unavailable: ${blackout.reason ?? 'Bay Unavailable'}.` }
  }

  try {
    const booking = await createBooking({
      member_id: user.id,
      bay_id,
      start_time,
      duration_minutes,
      guests: guests ?? [],
    })

    // Send confirmation email — fire and forget, don't block the booking response
    if (isResendConfigured()) {
      const { data: member } = await supabase
        .from('members')
        .select('full_name, email, email_booking_confirmation')
        .eq('id', user.id)
        .single()

      const { data: bay } = await supabase
        .from('bays')
        .select('name')
        .eq('id', bay_id)
        .single()

      if (member && bay && member.email_booking_confirmation) {
        const resend = createResendClient()
        void resend.emails.send({
          from: FROM_ADDRESSES.bookings,
          to: member.email,
          subject: `Booking Confirmed — ${bay.name}`,
          html: bookingConfirmationHtml({
            memberName: member.full_name,
            bayName: bay.name,
            startTime: new Date(start_time),
            durationMinutes: duration_minutes,
            guests: guests ?? [],
          }),
          text: bookingConfirmationText({
            memberName: member.full_name,
            bayName: bay.name,
            startTime: new Date(start_time),
            durationMinutes: duration_minutes,
            guests: guests ?? [],
          }),
        })
      }
    }

    revalidatePath('/reservations')
    revalidatePath('/account')
    return { booking }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Booking failed. Please try again.'
    return { error: message }
  }
}

export async function cancelBookingAction(
  bookingId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in.' }

  // Verify ownership and that it hasn't started
  const { data: booking } = await supabase
    .from('bookings')
    .select('member_id, start_time, cancelled_at')
    .eq('id', bookingId)
    .single()

  if (!booking) return { error: 'Booking not found.' }
  if (booking.cancelled_at) return { error: 'This booking is already cancelled.' }
  if (booking.member_id !== user.id) return { error: 'You can only cancel your own bookings.' }
  if (new Date(booking.start_time) <= new Date()) {
    return { error: 'Cannot cancel a booking that has already started.' }
  }

  try {
    await cancelBooking(bookingId)
    revalidatePath('/account')
    revalidatePath('/reservations')
    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cancellation failed. Please try again.'
    return { error: message }
  }
}
