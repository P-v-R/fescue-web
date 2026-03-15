import Link from 'next/link';

export const metadata = {
  title: 'About — Fescue Golf Club',
};

export default function AboutPage() {
  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-24'>
      {/* Header */}
      <div className='mb-14'>
        <p className='font-mono text-label uppercase tracking-[0.28em] text-gold-dark mb-1'>
          Our Story
        </p>
        <h1 className='font-serif text-3xl sm:text-display font-light text-navy'>
          About Fescue
        </h1>
        <div className='w-12 h-px bg-gold mt-4' />
      </div>

      <div className='space-y-16'>
        <section className='grid grid-cols-1 sm:grid-cols-2 gap-12 items-start'>
          <div className='space-y-4'>
            <p className='font-mono text-label font-medium uppercase tracking-[0.22em] text-navy/80'>
              Who We Are
            </p>
            <div className='space-y-2'>
              <div className='h-4 bg-navy/10 rounded w-full' />
              <div className='h-4 bg-navy/10 rounded w-5/6' />
              <div className='h-4 bg-navy/10 rounded w-full' />
              <div className='h-4 bg-navy/10 rounded w-4/6' />
            </div>
          </div>
          <div className='aspect-[4/3] bg-navy/[0.06] border border-navy/10 flex items-center justify-center'>
            <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/20'>
              Photo
            </p>
          </div>
        </section>

        <div className='h-px bg-sand/30' />

        <section className='grid grid-cols-1 sm:grid-cols-2 gap-12 items-start'>
          <div className='aspect-[4/3] bg-navy/[0.06] border border-navy/10 flex items-center justify-center sm:order-first order-last'>
            <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/20'>
              Photo
            </p>
          </div>
          <div className='space-y-4'>
            <p className='font-mono text-label font-medium uppercase tracking-[0.22em] text-navy/80'>
              The Space
            </p>
            <div className='space-y-2'>
              <div className='h-4 bg-navy/10 rounded w-full' />
              <div className='h-4 bg-navy/10 rounded w-3/4' />
              <div className='h-4 bg-navy/10 rounded w-full' />
              <div className='h-4 bg-navy/10 rounded w-5/6' />
              <div className='h-4 bg-navy/10 rounded w-2/3' />
            </div>
          </div>
        </section>

        <div className='h-px bg-sand/30' />

        <section>
          <p className='font-mono text-label font-medium uppercase tracking-[0.22em] text-navy/80 mb-8'>
            Our Values
          </p>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-8'>
            {['The Game', 'The Community', 'The Experience'].map((v) => (
              <div key={v} className='space-y-3'>
                <div className='w-6 h-px bg-gold' />
                <p className='font-mono text-label uppercase tracking-[0.2em] text-navy'>
                  {v}
                </p>
                <div className='space-y-1.5'>
                  <div className='h-3 bg-navy/10 rounded w-full' />
                  <div className='h-3 bg-navy/10 rounded w-5/6' />
                  <div className='h-3 bg-navy/10 rounded w-4/6' />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CTA */}
      <div className='mt-20 pt-12 border-t border-cream-mid text-center'>
        <p className='font-serif text-xl font-light text-navy mb-2'>
          Ready to see it in person?
        </p>
        <p className='font-mono text-label uppercase tracking-[0.15em] text-navy/45 mb-6'>
          Tours are available by appointment.
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
