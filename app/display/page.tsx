import type { Metadata } from 'next'
import { getBulletinPosts } from '@/lib/sanity/queries'
import {
  getDisplayActiveBays,
  getDisplayBlackoutsForToday,
  getDisplayBookingsForToday,
  getDisplayUpcomingEvents,
} from '@/lib/supabase/queries/display'
import { tokenValid } from '@/lib/utils/token'
import { DisplayClient } from './display-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Fescue — Bay Status',
  robots: 'noindex, nofollow',
}

type Props = {
  searchParams: Promise<{ token?: string }>
}

export default async function DisplayPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!tokenValid(token, process.env.DISPLAY_TOKEN)) {
    return (
      <div className='fixed inset-0 bg-navy-dark flex items-center justify-center'>
        <p className='font-mono text-xs uppercase tracking-[0.28em] text-cream/20'>403</p>
      </div>
    )
  }

  const [bays, bookings, blackouts, posts, events] = await Promise.all([
    getDisplayActiveBays(),
    getDisplayBookingsForToday(),
    getDisplayBlackoutsForToday(),
    getBulletinPosts(),
    getDisplayUpcomingEvents(),
  ])

  return (
    <DisplayClient
      bays={bays}
      initialBookings={bookings}
      initialBlackouts={blackouts}
      posts={posts}
      events={events}
      token={token!}
    />
  )
}
