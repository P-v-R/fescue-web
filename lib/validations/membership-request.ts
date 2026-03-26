import { z } from 'zod'

export const membershipRequestSchema = z.object({
  full_name: z.string().min(1, 'Please enter your name.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(1, 'Please enter your phone number.'),
  zip_code: z.string().max(20).optional(),
  profession: z.string().min(1, 'Please enter your profession.'),
  referral_source: z.string().min(1, 'Please tell us how you heard about Fescue.'),
  has_membership_org: z.boolean().optional(),
  membership_org_names: z.string().max(300).optional(),
  message: z.string().max(1000).optional(),
})

export type MembershipRequestInput = z.infer<typeof membershipRequestSchema>
