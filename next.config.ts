import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Sanity CDN
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      // Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Shopify CDN (for Prompt 7)
      {
        protocol: 'https',
        hostname: '*.myshopify.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
    ],
  },
}

export default nextConfig
