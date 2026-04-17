import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberNav } from '@/components/ui/member-nav'
import { AnnouncementBanner } from '@/components/ui/announcement-banner'
import { getAnnouncement } from '@/lib/sanity/queries'
import { HighContrastApplier } from './high-contrast-applier'
import { DarkModeApplier } from './dark-mode-applier'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: member }, announcement] = await Promise.all([
    supabase.from('members').select('full_name, is_admin, high_contrast, dark_mode').eq('id', user.id).single(),
    getAnnouncement(),
  ])

  const activeAnnouncement = announcement?.isActive ? announcement : null

  return (
    <div className="min-h-screen bg-cream-light">
      <DarkModeApplier enabled={member?.dark_mode ?? false} />
      <HighContrastApplier enabled={member?.high_contrast ?? false} />
      <MemberNav
        memberName={member?.full_name ?? ''}
        isAdmin={member?.is_admin ?? false}
      />
      {activeAnnouncement && <AnnouncementBanner announcement={activeAnnouncement} />}
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
