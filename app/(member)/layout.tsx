import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberNav } from '@/components/ui/member-nav'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('full_name, is_admin')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-cream-light">
      <MemberNav
        memberName={member?.full_name ?? ''}
        isAdmin={member?.is_admin ?? false}
      />
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
