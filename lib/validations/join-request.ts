import { z } from 'zod'

const FOUNDING_YEAR = 2022

export const joinRequestSchema = z
  .object({
    full_name: z.string().min(2, 'Full name is required.'),
    email: z.string().email('Please enter a valid email address.'),
    phone: z.string().optional(),
    discord: z.string().optional(),
    sgt_username: z.string().optional(),
    member_since: z
      .number({ message: 'Please select the year you joined.' })
      .int()
      .min(FOUNDING_YEAR, `Year must be ${FOUNDING_YEAR} or later.`)
      .max(new Date().getFullYear(), 'Year cannot be in the future.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  })

export type JoinRequestInput = z.infer<typeof joinRequestSchema>
