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
