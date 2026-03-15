import type { PortableTextBlock } from 'sanity'

export type { PortableTextBlock }

export type SanityImageAsset = {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export type BulletinPost = {
  _id: string
  _type: 'bulletinPost'
  title: string
  body: PortableTextBlock[] | null
  pinned: boolean
  archived: boolean
  publishedAt: string | null
}

export type SocialEvent = {
  _id: string
  _type: 'socialEvent'
  title: string
  description: PortableTextBlock[] | null
  date: string
  location: string | null
  image: SanityImageAsset | null
  rsvpUrl: string | null
}

export type ClubChampion = {
  year: number
  name: string
  tagline: string | null
}

export type SanityPartner = {
  _key: string
  name: string | null
  logo: SanityImageAsset | null
}

export type SanityValueCard = {
  _key: string
  title: string | null
  body: string | null
}

export type HomePage = {
  heroHeadline: string | null
  heroSubheadline: string | null
  heroCtaLabel: string | null
  storyEyebrow: string | null
  storyHeadline: string | null
  storyBody: string | null
  storyPhoto: SanityImageAsset | null
  clubhouseEyebrow: string | null
  clubhouseHeadline: string | null
  clubhouseBody: string | null
  clubhousePhotos: SanityImageAsset[] | null
  partnersEyebrow: string | null
  partnersHeadline: string | null
  partners: SanityPartner[] | null
  ctaEyebrow: string | null
  ctaHeadline: string | null
  ctaBody: string | null
}

export type AboutPage = {
  headerEyebrow: string | null
  headerHeadline: string | null
  whoWeAreBody: string | null
  whoWeArePhoto: SanityImageAsset | null
  theSpaceBody: string | null
  theSpacePhoto: SanityImageAsset | null
  valuesEyebrow: string | null
  values: SanityValueCard[] | null
  ctaHeadline: string | null
  ctaSubtext: string | null
}
