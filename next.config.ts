import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
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
      // Google Static Maps
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
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
