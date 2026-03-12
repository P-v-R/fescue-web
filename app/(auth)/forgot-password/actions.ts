'use server'

import { createClient } from '@/lib/supabase/server'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import type { ForgotPasswordInput } from '@/lib/validations/auth'

export async function forgotPasswordAction(
  input: ForgotPasswordInput,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/account/reset-password`,
  })

  // Always return success — don't reveal whether the email is registered
  if (error) {
    console.error('resetPasswordForEmail:', error.message)
  }

  return { success: true }
}
