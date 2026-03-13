import { z } from 'zod'

export const membershipRequestSchema = z.object({
  first_name: z.string().min(1, 'Please enter your first name.'),
  last_name: z.string().min(1, 'Please enter your last name.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().max(30).optional(),
  referral_source: z.string().max(200).optional(),
  message: z.string().max(500, 'Message must be 500 characters or fewer.').optional(),
})

export type MembershipRequestInput = z.infer<typeof membershipRequestSchema>
