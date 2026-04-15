import Link from 'next/link';
import Image from 'next/image';
import { getAboutPage } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/client';
import type { SanityImageAsset } from '@/lib/sanity/types';
import { PortableTextHeading } from '@/components/ui/portable-text-heading';

const hasContent = (v: unknown) => Array.isArray(v) && v.length > 0

export const metadata = {
  title: 'About — Fescue Golf Club',
};

function SanityImage({
  image,
  alt,
  sizes,
}: {
  image: SanityImageAsset;
  alt: string;
  sizes?: string;
}) {
  return (
    <Image
      src={urlFor(image).width(1200).url()}
      alt={alt}
      fill
      className='object-cover'
      sizes={sizes ?? '(max-width: 640px) 100vw, 50vw'}
    />
  );
}

export default async function AboutPage() {
  const cms = await getAboutPage();

  const values =
    cms?.values && cms.values.length > 0
      ? cms.values
      : [
          { _key: 'game', title: 'The Game', body: null },
          { _key: 'community', title: 'The Community', body: null },
          { _key: 'experience', title: 'The Experience', body: null },
        ];

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-24'>
      {/* Header */}
      <div className='mb-14'>
        <p className='font-mono text-label uppercase tracking-[0.28em] text-gold-dark mb-1'>
          Our Story
        </p>
        <h1 className='font-serif text-3xl sm:text-display font-light text-navy'>
          {hasContent(cms?.pageHeading) ? (
            <PortableTextHeading value={cms!.pageHeading!} />
          ) : (
            'About Fescue'
          )}
        </h1>
        <div className='w-12 h-px bg-gold mt-4' />
      </div>

      <div className='space-y-16'>
        {/* Who We Are */}
        <section className='grid grid-cols-1 sm:grid-cols-2 gap-12 items-start'>
          <div className='space-y-4'>
            <p className='font-mono text-label font-medium uppercase tracking-[0.22em] text-navy/80'>
              Who We Are
            </p>
            {cms?.whoWeAreBody ? (
              <div className='space-y-3'>
                {cms.whoWeAreBody.split('\n\n').map((para, i) => (
                  <p key={i} className='font-sans text-sm text-navy/70 leading-relaxed'>
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <div className='space-y-2'>
                <div className='h-4 bg-navy/10 rounded w-full' />
                <div className='h-4 bg-navy/10 rounded w-5/6' />
                <div className='h-4 bg-navy/10 rounded w-full' />
                <div className='h-4 bg-navy/10 rounded w-4/6' />
              </div>
            )}
          </div>
          <div className='relative aspect-[4/3] overflow-hidden'>
            {cms?.whoWeArePhoto ? (
              <SanityImage image={cms.whoWeArePhoto} alt='Who we are' />
            ) : (
              <div className='absolute inset-0 bg-navy/[0.06] border border-navy/10 flex items-center justify-center'>
                <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/20'>
                  Photo
                </p>
              </div>
            )}
          </div>
        </section>

        <div className='h-px bg-sand/30' />

        {/* The Space */}
        <section className='grid grid-cols-1 sm:grid-cols-2 gap-12 items-start'>
          <div className='relative aspect-[4/3] overflow-hidden sm:order-first order-last'>
            {cms?.theSpacePhoto ? (
              <SanityImage image={cms.theSpacePhoto} alt='The space' />
            ) : (
              <div className='absolute inset-0 bg-navy/[0.06] border border-navy/10 flex items-center justify-center'>
                <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/20'>
                  Photo
                </p>
              </div>
            )}
          </div>
          <div className='space-y-4'>
            <p className='font-mono text-label font-medium uppercase tracking-[0.22em] text-navy/80'>
              The Space
            </p>
            {cms?.theSpaceBody ? (
              <div className='space-y-3'>
                {cms.theSpaceBody.split('\n\n').map((para, i) => (
                  <p key={i} className='font-sans text-sm text-navy/70 leading-relaxed'>
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <div className='space-y-2'>
                <div className='h-4 bg-navy/10 rounded w-full' />
                <div className='h-4 bg-navy/10 rounded w-3/4' />
                <div className='h-4 bg-navy/10 rounded w-full' />
                <div className='h-4 bg-navy/10 rounded w-5/6' />
                <div className='h-4 bg-navy/10 rounded w-2/3' />
              </div>
            )}
          </div>
        </section>

        <div className='h-px bg-sand/30' />

        {/* Our Values */}
        <section>
          <p className='font-mono text-label font-medium uppercase tracking-[0.22em] text-navy/80 mb-8'>
            Our Values
          </p>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-8'>
            {values.map((v) => (
              <div key={v._key} className='space-y-3'>
                <div className='w-6 h-px bg-gold' />
                <p className='font-mono text-label uppercase tracking-[0.2em] text-navy'>
                  {v.title ?? ''}
                </p>
                {v.body ? (
                  <p className='font-sans text-sm text-navy/60 leading-relaxed'>{v.body}</p>
                ) : (
                  <div className='space-y-1.5'>
                    <div className='h-3 bg-navy/10 rounded w-full' />
                    <div className='h-3 bg-navy/10 rounded w-5/6' />
                    <div className='h-3 bg-navy/10 rounded w-4/6' />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CTA */}
      <div className='mt-20 pt-12 border-t border-cream-mid text-center'>
        <p className='font-serif text-xl font-light text-navy mb-2'>
          {hasContent(cms?.ctaHeading) ? (
            <PortableTextHeading value={cms!.ctaHeading!} />
          ) : (
            'Ready to see it in person?'
          )}
        </p>
        <p className='font-mono text-label uppercase tracking-[0.15em] text-navy/45 mb-6'>
          {cms?.ctaSubtext ?? 'Tours are available by appointment.'}
        </p>
        <Link
          href='/contact'
          className='inline-block bg-navy text-cream font-mono text-label uppercase tracking-[0.25em] px-8 py-3 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity'
        >
          Request a Tour
        </Link>
      </div>
    </div>
  );
}
