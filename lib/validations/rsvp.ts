import { z } from 'zod'

export const rsvpSchema = z.object({
  event_id: z.string().uuid('Invalid event ID.'),
  status: z.enum(['going', 'not_going']),
})

export type RsvpInput = z.infer<typeof rsvpSchema>
