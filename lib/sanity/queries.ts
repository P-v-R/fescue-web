import { startOfMonth, endOfMonth } from 'date-fns'
import { sanityClient, isSanityConfigured } from './client'
import type { BulletinPost, SocialEvent } from './types'

// ─── Bulletin Posts ───────────────────────────────────────────────────────────

export async function getBulletinPosts(): Promise<BulletinPost[]> {
  if (!isSanityConfigured()) return []

  try {
    return await sanityClient.fetch(
      `*[_type == "bulletinPost"] | order(pinned desc, publishedAt desc) {
        _id,
        _type,
        title,
        body,
        pinned,
        publishedAt
      }`,
      {},
      { next: { revalidate: 60 } },
    )
  } catch {
    return []
  }
}

// ─── Social Events ────────────────────────────────────────────────────────────

export async function getSocialEvents(month: Date): Promise<SocialEvent[]> {
  if (!isSanityConfigured()) return []

  const start = startOfMonth(month).toISOString()
  const end = endOfMonth(month).toISOString()

  try {
    return await sanityClient.fetch(
      `*[_type == "socialEvent" && date >= $start && date <= $end] | order(date asc) {
        _id,
        _type,
        title,
        description,
        date,
        location,
        image,
        rsvpUrl
      }`,
      { start, end },
      { next: { revalidate: 60 } },
    )
  } catch {
    return []
  }
}

// Next 10 upcoming events from today — used in dashboard sidebar
export async function getAllUpcomingEvents(): Promise<SocialEvent[]> {
  if (!isSanityConfigured()) return []

  try {
    return await sanityClient.fetch(
      `*[_type == "socialEvent" && date >= $now] | order(date asc) [0...10] {
        _id,
        _type,
        title,
        date,
        location,
        image,
        rsvpUrl
      }`,
      { now: new Date().toISOString() },
      { next: { revalidate: 60 } },
    )
  } catch {
    return []
  }
}
