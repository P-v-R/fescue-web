'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'
import type { LoginInput } from '@/lib/validations/auth'

export async function loginAction(
  input: LoginInput,
): Promise<{ error: string } | never> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Don't leak whether the email exists
    return { error: 'Invalid email or password. Please try again.' }
  }

  redirect('/dashboard')
}
