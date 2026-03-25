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

export type SanityFeature = {
  _key: string
  label: string | null
  body: string | null
}

export type SanityValueCard = {
  _key: string
  title: string | null
  body: string | null
}

export type SanityAnnouncement = {
  isActive: boolean
  type: 'announcement' | 'alert'
  message: string
}

export type HomePage = {
  featuresPhoto: SanityImageAsset | null
  features: SanityFeature[] | null
  storyBody: string | null
  storyPhoto: SanityImageAsset | null
  clubhousePhotos: SanityImageAsset[] | null
  clubhouseBody: string | null
  partners: SanityPartner[] | null
}

export type AboutPage = {
  whoWeAreBody: string | null
  whoWeArePhoto: SanityImageAsset | null
  theSpaceBody: string | null
  theSpacePhoto: SanityImageAsset | null
  values: SanityValueCard[] | null
}
