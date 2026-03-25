import { z } from 'zod'

const guestSchema = z.object({
  name: z.string().min(1, 'Guest name is required'),
  email: z.string().email('Invalid guest email'),
})

export const newBookingSchema = z.object({
  bay_id: z.string().uuid('Invalid bay selected'),
  start_time: z.string().min(1, 'Start time is required'),
  duration_minutes: z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(120)]),
  guests: z.array(guestSchema).max(3, 'Maximum 3 guests allowed').default([]),
})

export type NewBookingInput = z.infer<typeof newBookingSchema>
