import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  starts_at: z.string().min(1, 'Start date and time is required.'),
  ends_at: z.string().optional(),
  location: z.string().optional(),
  image_url: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  rsvp_enabled: z.boolean().default(true),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
