import { getSocialEvents } from '@/lib/sanity/queries'
import { CalendarWrapper } from './calendar-wrapper'

export const metadata = {
  title: 'Social Calendar — Fescue',
}

export default async function CalendarPage() {
  const initialEvents = await getSocialEvents(new Date())

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-1">
          Member Portal
        </p>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy">Social Calendar</h1>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      <CalendarWrapper initialEvents={initialEvents} />
    </div>
  )
}
