import Link from 'next/link';
import Image from 'next/image';
import { PublicNav } from '@/components/ui/public-nav';
import { ParallaxDecor } from '@/components/ui/parallax-decor';
import { HeroReveal } from '@/components/ui/hero-reveal';
import { CartProvider } from '@/components/shop/cart-provider';
import { CartDrawer } from '@/components/shop/cart-drawer';

export const metadata = {
  title: 'Fescue Golf Club — Private Golf Club',
};

export default function HomePage() {
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
                  src='/logo-badge2.png'
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
                  The membership golf club.
                  <br />
                  <em>reinvented</em>
                </h1>
                <div
                  className='hero-item w-12 h-px bg-gold mx-auto mb-8'
                  style={{ transitionDelay: '380ms' }}
                />
                <div
                  className='hero-item max-w-sm mx-auto mb-2 space-y-2.5'
                  style={{ transitionDelay: '500ms' }}
                >
                  <div className='h-3.5 bg-cream/10 rounded w-full' />
                  <div className='h-3.5 bg-cream/10 rounded w-5/6 mx-auto' />
                  <div className='h-3.5 bg-cream/10 rounded w-4/6 mx-auto' />
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

          {/* ── Feature strip (cream) ─────────────────────────────────────── */}
          <section className='relative overflow-hidden py-20 px-6 bg-cream border-b border-cream-mid'>
            <div className='absolute inset-0 bg-[url(/soft-wallpaper.png)] bg-repeat opacity-[0.54] pointer-events-none' />
            <div className='relative z-10 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center'>
              {['Feature One', 'Feature Two', 'Feature Three'].map((label) => (
                <div key={label} className='flex flex-col items-center gap-4'>
                  <div className='w-8 h-px bg-gold' />
                  <p className='font-mono text-label uppercase tracking-[0.25em] text-navy'>
                    {label}
                  </p>
                  <div className='space-y-1.5 w-full max-w-[200px] mx-auto'>
                    <div className='h-3 bg-navy/10 rounded w-full' />
                    <div className='h-3 bg-navy/10 rounded w-5/6 mx-auto' />
                    <div className='h-3 bg-navy/10 rounded w-4/6 mx-auto' />
                  </div>
                </div>
              ))}
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
                className='opacity-[0.07] -scale-x-100'
                aria-hidden={true}
              />
            </ParallaxDecor>

            <div className='relative z-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
              <div>
                <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-2'>
                  Our Story
                </p>
                <h2 className='font-serif text-3xl sm:text-4xl font-light text-cream mb-6 leading-snug'>
                  <em>The country club</em>
                  <br />
                  for the <em>not</em> country club set.
                </h2>
                <div className='w-10 h-px bg-gold mb-8' />
                <div className='space-y-3'>
                  <div className='h-3.5 bg-cream/10 rounded w-full' />
                  <div className='h-3.5 bg-cream/10 rounded w-11/12' />
                  <div className='h-3.5 bg-cream/10 rounded w-full' />
                  <div className='h-3.5 bg-cream/10 rounded w-4/5' />
                  <div className='h-3.5 bg-cream/10 rounded w-full' />
                  <div className='h-3.5 bg-cream/10 rounded w-3/4' />
                </div>
                <div className='mt-10 space-y-3'>
                  <div className='h-3.5 bg-cream/10 rounded w-full' />
                  <div className='h-3.5 bg-cream/10 rounded w-5/6' />
                  <div className='h-3.5 bg-cream/10 rounded w-full' />
                  <div className='h-3.5 bg-cream/10 rounded w-2/3' />
                </div>
              </div>
              <div className='aspect-[4/3] bg-cream/[0.05] border border-cream/10 flex items-center justify-center'>
                <p className='font-mono text-label uppercase tracking-[0.2em] text-cream/15'>
                  Photo
                </p>
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
                  Not for everyone.
                  <br />
                  <em>For us.</em>
                </h2>
                <div className='w-10 h-px bg-gold mx-auto mt-6' />
              </div>

              {/* Photo grid */}
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14'>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={[
                      'bg-sand/30 border border-sand/40 flex items-center justify-center',
                      i === 0
                        ? 'aspect-square sm:col-span-2 sm:row-span-2'
                        : 'aspect-square',
                    ].join(' ')}
                  >
                    <p className='font-mono text-label uppercase tracking-[0.15em] text-navy/20'>
                      Photo
                    </p>
                  </div>
                ))}
              </div>

              {/* Blurb */}
              <div className='max-w-2xl mx-auto text-center space-y-2'>
                <div className='h-3.5 bg-sand/50 rounded w-full mx-auto' />
                <div className='h-3.5 bg-sand/50 rounded w-5/6 mx-auto' />
                <div className='h-3.5 bg-sand/50 rounded w-4/6 mx-auto' />
              </div>
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
                className='opacity-[0.07]'
                aria-hidden={true}
              />
            </ParallaxDecor>

            <div className='relative z-10 max-w-5xl mx-auto'>
              <div className='text-center mb-14'>
                <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-2'>
                  Our Partners
                </p>
                <h2 className='font-serif text-3xl sm:text-4xl font-light text-cream leading-snug'>
                  <em>Supported by brands</em>
                  <br />
                  that share our standards.
                </h2>
                <div className='w-10 h-px bg-gold mx-auto mt-6' />
              </div>

              {/* Partner logo placeholders */}
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
                Come see it for yourself.
              </h2>
              <div className='max-w-xs mx-auto space-y-2 mb-8'>
                <div className='h-3 bg-navy/10 rounded w-full' />
                <div className='h-3 bg-navy/10 rounded w-4/5 mx-auto' />
              </div>
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
              src='/logo-badge2.png'
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
