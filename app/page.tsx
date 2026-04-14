import Link from 'next/link';
import Image from 'next/image';
import { PublicNav } from '@/components/ui/public-nav';
import { ParallaxDecor } from '@/components/ui/parallax-decor';
import { HeroReveal } from '@/components/ui/hero-reveal';
import { CartProvider } from '@/components/shop/cart-provider';
import { CartDrawer } from '@/components/shop/cart-drawer';
import { ClubhouseCarousel } from '@/components/ui/clubhouse-carousel';
import { getHomePage } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/client';
import type { SanityImageAsset } from '@/lib/sanity/types';
import { PortableTextHeading } from '@/components/ui/portable-text-heading';

const hasContent = (v: unknown) => Array.isArray(v) && v.length > 0;

export const metadata = {
  title: 'Fescue Golf Club — Private Golf Club',
};

function SanityImage({
  image,
  alt,
  className,
  sizes,
}: {
  image: SanityImageAsset;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <Image
      src={urlFor(image).width(1200).url()}
      alt={alt}
      fill
      className={className ?? 'object-cover'}
      sizes={sizes ?? '(max-width: 1024px) 100vw, 50vw'}
    />
  );
}

const FEATURE_PLACEHOLDERS = ['Feature One', 'Feature Two', 'Feature Three'];

export default async function HomePage() {
  const cms = await getHomePage();

  return (
    <CartProvider>
      <div className='min-h-screen bg-cream flex flex-col'>
        <PublicNav />

        <main className='flex-1'>
          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <section className='relative flex flex-col items-center justify-center text-center px-6 py-28 sm:py-44 overflow-hidden bg-navy-dark'>
            <div className='absolute inset-0 bg-[url(/soft-wallpaper.png)] bg-repeat opacity-[0.08] pointer-events-none' />
            <div className='absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_40%,rgba(184,158,86,0.08),transparent)] pointer-events-none' />

            <HeroReveal>
              <div className='relative z-10 max-w-2xl mx-auto flex flex-col items-center'>
                <Image
                  src='/logo-badge.png'
                  alt='Fescue Golf Club'
                  width={280}
                  height={280}
                  className='hero-item object-contain mb-10 drop-shadow-[0_4px_32px_rgba(184,158,86,0.22)] mix-blend-multiply'
                  style={{ transitionDelay: '0ms' }}
                  priority
                />
                <h1
                  className='hero-item font-serif text-4xl sm:text-5xl font-light text-cream mb-6 leading-tight'
                  style={{ transitionDelay: '200ms' }}
                >
                  {hasContent(cms?.heroHeading) ? (
                    <PortableTextHeading value={cms!.heroHeading!} />
                  ) : (
                    'Private. Not Exclusive.'
                  )}
                </h1>
                <div
                  className='hero-item w-12 h-px bg-gold mx-auto mb-8'
                  style={{ transitionDelay: '380ms' }}
                />
                <div
                  className='hero-item max-w-sm mx-auto mb-2 space-y-2.5'
                  style={{ transitionDelay: '500ms' }}
                >
                  {cms?.heroSubtext ? (
                    <p className='font-sans text-sm text-cream/75 leading-relaxed'>
                      {cms.heroSubtext}
                    </p>
                  ) : (
                    <>
                      <div className='h-3.5 bg-cream/10 rounded w-full' />
                      <div className='h-3.5 bg-cream/10 rounded w-5/6 mx-auto' />
                      <div className='h-3.5 bg-cream/10 rounded w-4/6 mx-auto' />
                    </>
                  )}
                </div>
                <div
                  className='hero-item flex flex-col sm:flex-row gap-4 justify-center'
                  style={{ transitionDelay: '640ms' }}
                >
                  <Link
                    href='/contact'
                    className='bg-gold text-navy-dark font-mono text-label uppercase tracking-[0.25em] px-8 py-3 mb-6 hover:opacity-80 transition-opacity'
                  >
                    Request a Tour
                  </Link>
                </div>
              </div>
            </HeroReveal>
          </section>

          {/* ── Feature strip (full-bleed photo) ──────────────────────────── */}
          <section className='relative overflow-hidden min-h-screen flex items-center justify-center px-6 py-28'>
            {/* Background photo from Sanity */}
            {cms?.featuresPhoto ? (
              <Image
                src={urlFor(cms.featuresPhoto).width(2400).url()}
                alt=''
                fill
                className='object-cover object-center'
                sizes='100vw'
                priority
              />
            ) : (
              <div className='absolute inset-0 bg-navy-dark' />
            )}
            <div className='relative z-10 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-14 text-center'>
              {FEATURE_PLACEHOLDERS.map((placeholder, i) => {
                const feature = cms?.features?.[i];
                return (
                  <div
                    key={i}
                    className='flex flex-col items-center gap-4 bg-navy-dark/50 px-6 py-8'
                  >
                    <div className='w-8 h-px bg-gold' />
                    <p className='font-mono text-base uppercase tracking-[0.25em] text-cream'>
                      {feature?.label ?? placeholder}
                    </p>
                    {feature?.body ? (
                      <p className='font-sans text-sm text-cream/65 leading-relaxed max-w-[220px]'>
                        {feature.body}
                      </p>
                    ) : (
                      <div className='space-y-1.5 w-full max-w-[200px] mx-auto'>
                        <div className='h-3 bg-cream/15 rounded w-full' />
                        <div className='h-3 bg-cream/15 rounded w-5/6 mx-auto' />
                        <div className='h-3 bg-cream/15 rounded w-4/6 mx-auto' />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Our Story (navy-dark) ─────────────────────────────────────── */}
          <section className='relative overflow-hidden bg-navy-dark py-24 sm:py-32 px-6'>
            <div className='absolute inset-0 bg-[url(/soft-wallpaper.png)] bg-repeat opacity-[0.08] pointer-events-none' />
            <ParallaxDecor
              speed={0.2}
              className='absolute top-1/2 -translate-y-1/2 -left-10 pointer-events-none select-none'
            >
              <Image
                src='/logo-quail.png'
                alt=''
                width={400}
                height={476}
                className='opacity-[0.07] -scale-x-100 brightness-0 invert'
                aria-hidden={true}
              />
            </ParallaxDecor>

            <div className='relative z-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
              <div>
                <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-2'>
                  Our Story
                </p>
                <h2 className='font-serif text-3xl sm:text-4xl font-light text-cream mb-6 leading-snug'>
                  {hasContent(cms?.storyHeading) ? (
                    <PortableTextHeading value={cms!.storyHeading!} />
                  ) : (
                    <>
                      <em>The country club</em>
                      <br />
                      for the <em>not</em> country club set.
                    </>
                  )}
                </h2>
                <div className='w-10 h-px bg-gold mb-8' />
                {cms?.storyBody ? (
                  <div className='space-y-4'>
                    {cms.storyBody.split('\n\n').map((para, i) => (
                      <p
                        key={i}
                        className='font-sans text-sm text-cream/75 leading-relaxed'
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <div className='h-3.5 bg-cream/10 rounded w-full' />
                    <div className='h-3.5 bg-cream/10 rounded w-11/12' />
                    <div className='h-3.5 bg-cream/10 rounded w-full' />
                    <div className='h-3.5 bg-cream/10 rounded w-4/5' />
                    <div className='h-3.5 bg-cream/10 rounded w-full' />
                    <div className='h-3.5 bg-cream/10 rounded w-3/4' />
                    <div className='mt-10 space-y-3'>
                      <div className='h-3.5 bg-cream/10 rounded w-full' />
                      <div className='h-3.5 bg-cream/10 rounded w-5/6' />
                      <div className='h-3.5 bg-cream/10 rounded w-full' />
                      <div className='h-3.5 bg-cream/10 rounded w-2/3' />
                    </div>
                  </div>
                )}
              </div>
              <div className='relative aspect-[4/3] overflow-hidden'>
                {cms?.storyPhoto ? (
                  <SanityImage image={cms.storyPhoto} alt='Our story' />
                ) : (
                  <div className='absolute inset-0 bg-cream/[0.05] border border-cream/10 flex items-center justify-center'>
                    <p className='font-mono text-label uppercase tracking-[0.2em] text-cream/15'>
                      Photo
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Clubhouse (cream/sand) ─────────────────────────────────────── */}
          <section className='relative overflow-hidden bg-[#f5ede0] py-24 sm:py-32 px-6 border-y border-sand/30'>
            <div className='absolute inset-0 bg-[url(/soft-wallpaper.png)] bg-repeat opacity-[0.54] pointer-events-none' />
            <div className='relative z-10 max-w-5xl mx-auto'>
              <div className='text-center mb-14'>
                <p className='font-mono text-label uppercase tracking-[0.28em] text-gold-dark mb-2'>
                  Clubhouse
                </p>
                <h2 className='font-serif text-3xl sm:text-4xl font-light text-navy leading-snug'>
                  {hasContent(cms?.clubhouseHeading) ? (
                    <PortableTextHeading value={cms!.clubhouseHeading!} />
                  ) : (
                    <>
                      Not for everyone.
                      <br />
                      <em>For us.</em>
                    </>
                  )}
                </h2>
                <div className='w-10 h-px bg-gold mx-auto mt-6' />
              </div>

              {/* Carousel */}
              <div className='mb-14 overflow-hidden'>
                <ClubhouseCarousel
                  slides={
                    cms?.clubhousePhotos && cms.clubhousePhotos.length > 0
                      ? cms.clubhousePhotos.map((photo, i) => ({
                          url: urlFor(photo).width(1800).url(),
                          alt: `Clubhouse photo ${i + 1}`,
                        }))
                      : null
                  }
                />
              </div>

              {/* Body */}
              {cms?.clubhouseBody ? (
                <div className='max-w-2xl mx-auto text-center'>
                  <p className='font-sans text-sm text-navy/70 leading-relaxed'>
                    {cms.clubhouseBody}
                  </p>
                </div>
              ) : (
                <div className='max-w-2xl mx-auto text-center space-y-2'>
                  <div className='h-3.5 bg-sand/50 rounded w-full mx-auto' />
                  <div className='h-3.5 bg-sand/50 rounded w-5/6 mx-auto' />
                  <div className='h-3.5 bg-sand/50 rounded w-4/6 mx-auto' />
                </div>
              )}
            </div>
          </section>

          {/* ── Our Partners (navy-dark) ──────────────────────────────────── */}
          <section className='relative overflow-hidden bg-navy-dark py-24 sm:py-32 px-6'>
            <div className='absolute inset-0 bg-[url(/soft-wallpaper.png)] bg-repeat opacity-[0.08] pointer-events-none' />
            <ParallaxDecor
              speed={0.2}
              className='absolute top-1/2 -translate-y-1/2 -right-10 pointer-events-none select-none'
            >
              <Image
                src='/logo-quail.png'
                alt=''
                width={380}
                height={452}
                className='opacity-[0.07] brightness-0 invert'
                aria-hidden={true}
              />
            </ParallaxDecor>

            <div className='relative z-10 max-w-5xl mx-auto'>
              <div className='text-center mb-14'>
                <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-2'>
                  Our Partners
                </p>
                <h2 className='font-serif text-3xl sm:text-4xl font-light text-cream leading-snug'>
                  {hasContent(cms?.partnersHeading) ? (
                    <PortableTextHeading value={cms!.partnersHeading!} />
                  ) : (
                    <>
                      <em>Supported by brands</em>
                      <br />
                      that share our standards.
                    </>
                  )}
                </h2>
                <div className='w-10 h-px bg-gold mx-auto mt-6' />
              </div>

              {cms?.partners && cms.partners.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-6'>
                  {cms.partners.map((partner) => {
                    const inner = (
                      <>
                        {partner.logo ? (
                          <div className='relative w-full h-10'>
                            <SanityImage
                              image={partner.logo}
                              alt={partner.name ?? 'Partner logo'}
                              className='object-contain'
                              sizes='(max-width: 640px) 50vw, 25vw'
                            />
                          </div>
                        ) : (
                          <p className='font-mono text-label uppercase tracking-[0.15em] text-cream/40 text-center'>
                            {partner.name ?? ''}
                          </p>
                        )}
                      </>
                    );
                    const sharedClass =
                      'h-20 bg-cream/[0.04] border border-cream/[0.08] flex items-center justify-center px-4';
                    return partner.url ? (
                      <a
                        key={partner._key}
                        href={partner.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className={`${sharedClass} hover:bg-cream/[0.08] transition-colors`}
                      >
                        {inner}
                      </a>
                    ) : (
                      <div key={partner._key} className={sharedClass}>
                        {inner}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-6'>
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className='h-20 bg-cream/[0.04] border border-cream/[0.08] flex items-center justify-center'
                    >
                      <div className='w-16 h-5 bg-cream/10 rounded' />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── CTA (cream) ───────────────────────────────────────────────── */}
          <section className='relative py-24 px-6 bg-cream text-center border-t border-cream-mid'>
            <div className='absolute inset-0 bg-[url(/soft-wallpaper.png)] bg-repeat opacity-[0.54] pointer-events-none' />
            <div className='relative z-10'>
              <p className='font-mono text-label uppercase tracking-[0.28em] text-gold-dark mb-3'>
                Interested?
              </p>
              <h2 className='font-serif text-2xl sm:text-3xl font-light text-navy mb-5'>
                {hasContent(cms?.ctaHeading) ? (
                  <PortableTextHeading value={cms!.ctaHeading!} />
                ) : (
                  'Come see it for yourself.'
                )}
              </h2>
              {cms?.ctaSubtext ? (
                <p className='max-w-xs mx-auto font-sans text-sm text-navy/70 leading-relaxed mb-8'>
                  {cms.ctaSubtext}
                </p>
              ) : (
                <div className='max-w-xs mx-auto space-y-2 mb-8'>
                  <div className='h-3 bg-navy/10 rounded w-full' />
                  <div className='h-3 bg-navy/10 rounded w-4/5 mx-auto' />
                </div>
              )}
              <Link
                href='/contact'
                className='inline-block bg-navy text-cream font-mono text-label uppercase tracking-[0.25em] px-8 py-3 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-80 transition-opacity'
              >
                Request a Tour
              </Link>
            </div>
          </section>
        </main>

        <footer className='relative border-t border-cream-mid bg-cream py-8'>
          <div className='absolute inset-0 bg-[url(/soft-wallpaper.png)] bg-repeat opacity-[0.54] pointer-events-none' />
          <div className='relative z-10 max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4'>
            <Image
              src='/logo-badge.png'
              alt='Fescue Golf Club'
              width={36}
              height={36}
              className='object-contain opacity-60'
            />
            <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/30'>
              © {new Date().getFullYear()} Fescue Golf Club. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
      <CartDrawer />
    </CartProvider>
  );
}
