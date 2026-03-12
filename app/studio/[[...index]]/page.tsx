import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudioClient } from './studio-client'

// Studio is a fully dynamic page — no static rendering
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Fescue Club Admin — Sanity Studio',
  robots: { index: false },
}

export default async function StudioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('is_admin, is_active')
    .eq('id', user.id)
    .single()

  if (!member?.is_admin || !member?.is_active) {
    redirect('/dashboard')
  }

  return <StudioClient />
}
