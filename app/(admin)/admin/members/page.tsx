import { getAllMembers } from '@/lib/supabase/queries/members'
import { MembersClient } from './members-client'

export const metadata = {
  title: 'Members — Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminMembersPage() {
  const members = await getAllMembers()

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-1">Admin</p>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy">Members</h1>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      <MembersClient members={members} />
    </div>
  )
}
