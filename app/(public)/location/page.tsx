import Image from 'next/image';

export const metadata = {
  title: 'Location — Fescue Golf Club',
};

export default function LocationPage() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const address = encodeURIComponent(process.env.NEXT_PUBLIC_CLUB_ADDRESS ?? '')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(process.env.NEXT_PUBLIC_CLUB_ADDRESS ?? '')}`

  const markerParam = appUrl && !appUrl.includes('localhost')
    ? `markers=icon:${appUrl}/logo-badge.png|${address}`
    : `markers=color:0xb8963c|${address}`

  const staticUrl = key
    ? `https://maps.googleapis.com/maps/api/staticmap` +
      `?center=${address}` +
      `&zoom=15` +
      `&size=1280x640` +
      `&scale=2` +
      `&${markerParam}` +
      `&style=feature:poi|visibility:off` +
      `&style=feature:transit|visibility:off` +
      `&style=feature:road.highway|element:geometry|color:0xe8e0d0` +
      `&style=feature:road.arterial|element:geometry|color:0xf0ebe0` +
      `&style=feature:landscape|element:geometry|color:0xf5f0e8` +
      `&style=feature:water|element:geometry|color:0xd4cfc6` +
      `&style=feature:all|element:labels.text.fill|color:0x004225` +
      `&style=feature:all|element:labels.text.stroke|color:0xf5f0e8` +
      `&key=${key}`
    : null

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-24'>
      {/* Header */}
      <div className='mb-14'>
        <p className='font-mono text-label uppercase tracking-[0.28em] text-gold-dark mb-1'>
          Find Us
        </p>
        <h1 className='font-serif text-3xl sm:text-display font-light text-navy'>
          Locations
        </h1>
        <div className='w-12 h-px bg-gold mt-4' />
      </div>

      {/* Location entry */}
      <div className='space-y-10'>
        <div className='flex items-baseline gap-6'>
          <span className='font-mono text-label uppercase tracking-[0.28em] text-gold'>01</span>
          <div>
            <p className='font-serif text-2xl font-light text-navy'>West LA</p>
            <p className='font-mono text-label uppercase tracking-[0.18em] text-navy/40 mt-1'>
              Los Angeles, California
            </p>
          </div>
        </div>

        {/* Map */}
        {staticUrl ? (
          <a
            href={mapsUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='block relative border border-sand/40 group'
          >
            <span className='absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/40 z-10' />
            <span className='absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/40 z-10' />
            <span className='absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/40 z-10' />
            <span className='absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/40 z-10' />
            <Image
              src={staticUrl}
              alt='Fescue Golf Club — West LA'
              width={1280}
              height={640}
              className='w-full h-auto block'
              unoptimized
            />
            <div className='absolute inset-0 bg-navy/0 group-hover:bg-navy/5 transition-colors duration-200 flex items-center justify-center'>
              <span className='opacity-0 group-hover:opacity-100 transition-opacity font-mono text-label uppercase tracking-[0.2em] text-navy bg-cream/90 px-4 py-2 shadow-sm'>
                Open in Maps
              </span>
            </div>
          </a>
        ) : (
          <div className='aspect-[2/1] bg-navy/[0.04] border border-navy/10 flex items-center justify-center'>
            <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/20'>Map</p>
          </div>
        )}
      </div>
    </div>
  )
}
