import { sanityClient, isSanityConfigured } from './client'
import type { BulletinPost, ClubChampion, HomePage, AboutPage, SanityAnnouncement } from './types'

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

// ─── Page Content (Singletons) ────────────────────────────────────────────────

export async function getHomePage(): Promise<HomePage | null> {
  if (!isSanityConfigured()) return null

  try {
    return await sanityClient.fetch(
      `*[_type == "homePage"][0] {
        heroHeading,
        heroSubtext,
        featuresPhoto,
        features[] { _key, label, body },
        storyHeading,
        storyBody,
        storyPhoto,
        clubhouseHeading,
        clubhousePhotos,
        clubhouseBody,
        partnersHeading,
        partners[] { _key, name, logo, url },
        ctaHeading,
        ctaSubtext,
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
        pageHeading,
        whoWeAreBody,
        whoWeArePhoto,
        theSpaceBody,
        theSpacePhoto,
        values[] { _key, title, body },
        ctaHeading,
        ctaSubtext,
      }`,
      {},
      { next: { revalidate: 60 } },
    )
  } catch {
    return null
  }
}

// ─── Announcement Banner ──────────────────────────────────────────────────────

export async function getAnnouncement(): Promise<SanityAnnouncement | null> {
  if (!isSanityConfigured()) return null

  try {
    return await sanityClient.fetch(
      `*[_type == "announcement" && _id == "announcement"][0] {
        isActive,
        type,
        message,
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
      `*[_type == "clubChampion"] | order(year desc, championship asc, category asc) { year, championship, category, name, tagline }`,
      {},
      { next: { revalidate: 300 } },
    )
  } catch {
    return []
  }
}
