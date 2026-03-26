import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

const FOUNDING_YEAR = 2022

export const acceptInviteSchema = z
  .object({
    full_name: z.string().min(2, 'Please enter your full name'),
    phone: z.string().optional(),
    discord: z.string().optional(),
    member_since: z
      .number({ required_error: 'Please select the year you joined.' })
      .int()
      .min(FOUNDING_YEAR, `Year must be ${FOUNDING_YEAR} or later.`)
      .max(new Date().getFullYear(), 'Year cannot be in the future.'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>
