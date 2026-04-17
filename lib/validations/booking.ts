import { z } from 'zod'

const guestSchema = z.object({
  name: z.string().min(1, 'Guest name is required'),
  email: z.string().email('Invalid guest email').optional().or(z.literal('')),
})

export const newBookingSchema = z.object({
  bay_id: z.string().uuid('Invalid bay selected'),
  start_time: z.string().min(1, 'Start time is required'),
  duration_minutes: z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(120)]),
  guests: z.array(guestSchema).max(3, 'Maximum 3 guests allowed').default([]),
})

// Base inferred type (strict schema for member bookings)
type _NewBookingInputBase = z.infer<typeof newBookingSchema>

// Allow wider duration for admin submissions — server validates actual range
export type NewBookingInput = Omit<_NewBookingInputBase, 'duration_minutes'> & { duration_minutes: number }
