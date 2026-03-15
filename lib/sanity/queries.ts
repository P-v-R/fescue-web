import { startOfMonth, endOfMonth } from 'date-fns'
import { sanityClient, isSanityConfigured } from './client'
import type { BulletinPost, SocialEvent, ClubChampion, HomePage, AboutPage } from './types'

// ─── Bulletin Posts ───────────────────────────────────────────────────────────

export async function getBulletinPosts(): Promise<BulletinPost[]> {
  if (!isSanityConfigured()) return []

  try {
    return await sanityClient.fetch(
      `*[_type == "bulletinPost" && archived != true] | order(pinned desc, publishedAt desc) {
        _id,
        _type,
        title,
        body,
        pinned,
        archived,
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

// ─── Page Content (Singletons) ────────────────────────────────────────────────

export async function getHomePage(): Promise<HomePage | null> {
  if (!isSanityConfigured()) return null

  try {
    return await sanityClient.fetch(
      `*[_type == "homePage"][0] {
        heroHeadline,
        heroSubheadline,
        heroCtaLabel,
        storyEyebrow,
        storyHeadline,
        storyBody,
        storyPhoto,
        clubhouseEyebrow,
        clubhouseHeadline,
        clubhouseBody,
        clubhousePhotos,
        partnersEyebrow,
        partnersHeadline,
        partners[] { _key, name, logo },
        ctaEyebrow,
        ctaHeadline,
        ctaBody,
      }`,
      {},
      { next: { revalidate: 60 } },
    )
  } catch {
    return null
  }
}

export async function getAboutPage(): Promise<AboutPage | null> {
  if (!isSanityConfigured()) return null

  try {
    return await sanityClient.fetch(
      `*[_type == "aboutPage"][0] {
        headerEyebrow,
        headerHeadline,
        whoWeAreBody,
        whoWeArePhoto,
        theSpaceBody,
        theSpacePhoto,
        valuesEyebrow,
        values[] { _key, title, body },
        ctaHeadline,
        ctaSubtext,
      }`,
      {},
      { next: { revalidate: 60 } },
    )
  } catch {
    return null
  }
}

// ─── Club Champions ───────────────────────────────────────────────────────────

export async function getAllChampions(): Promise<ClubChampion[]> {
  if (!isSanityConfigured()) return []

  try {
    return await sanityClient.fetch(
      `*[_type == "clubChampion"] | order(year desc) { year, name, tagline }`,
      {},
      { next: { revalidate: 300 } },
    )
  } catch {
    return []
  }
}
