import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEventsForMonth } from '@/lib/supabase/queries/events'
import { getMemberRsvpsForEvents } from '@/lib/supabase/queries/event-rsvps'
import { CalendarWrapper } from './calendar-wrapper'

export const metadata = {
  title: 'Social Calendar — Fescue',
}

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [initialEvents, member] = await Promise.all([
    getEventsForMonth(new Date()),
    supabase.from('members').select('is_admin').eq('id', user.id).single(),
  ])
  const isAdmin = member.data?.is_admin ?? false

  const initialUserRsvps = await getMemberRsvpsForEvents(
    user.id,
    initialEvents.map((e) => e.id),
  )

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-1">
          Member Portal
        </p>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy">Social Calendar</h1>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      <CalendarWrapper initialEvents={initialEvents} initialUserRsvps={initialUserRsvps} isAdmin={isAdmin} />
    </div>
  )
}
