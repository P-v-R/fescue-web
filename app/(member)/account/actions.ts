'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { notifySuggestion } from '@/lib/discord/notify'

export async function logoutAction(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function updateProfileAction(input: {
  phone: string
  discord: string
  sgt_username: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const phone = input.phone.trim().slice(0, 20) || null
  const discord = input.discord.trim().slice(0, 100) || null
  const sgt_username = input.sgt_username.trim().slice(0, 100) || null

  const { error } = await supabase
    .from('members')
    .update({ phone, discord, sgt_username })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/account')
  revalidatePath('/members')
  return {}
}

export async function submitSuggestionAction(input: {
  body: string
  anonymous: boolean
}): Promise<{ error?: string }> {
  const body = input.body.trim().slice(0, 2000)
  if (!body) return { error: 'Suggestion cannot be empty.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const { data: member } = await supabase
    .from('members')
    .select('full_name')
    .eq('id', user.id)
    .single()

  await notifySuggestion({
    body,
    memberName: member?.full_name ?? 'Unknown member',
    anonymous: input.anonymous,
  })

  return {}
}

export async function updatePreferencesAction(input: {
  email_booking_confirmation: boolean
  high_contrast: boolean
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const { error } = await supabase
    .from('members')
    .update({
      email_booking_confirmation: input.email_booking_confirmation,
      high_contrast: input.high_contrast,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/account')
  return {}
}
