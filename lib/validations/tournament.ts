import { z } from 'zod'

export const createTournamentSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional(),
  format: z.enum(['single_elim', 'double_elim'], { message: 'Select a format.' }),
  // null = unlimited. The action coerces the form value before parsing.
  capacity: z.number().int().min(2, 'Capacity must be at least 2.').nullable().optional(),
  registration_closes_at: z.string().optional(),
  starts_at: z.string().optional(),
})

export const updateTournamentSchema = createTournamentSchema

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>
