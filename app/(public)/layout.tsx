import Image from 'next/image';
import { CartProvider } from '@/components/shop/cart-provider';
import { CartDrawer } from '@/components/shop/cart-drawer';
import { PublicNav } from '@/components/ui/public-nav';
import { MetaPixel } from '@/components/meta-pixel';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      {META_PIXEL_ID && <MetaPixel pixelId={META_PIXEL_ID} />}
      <div className='relative min-h-screen bg-cream flex flex-col'>
        <div className='fixed inset-0 bg-[url(/soft-wallpaper.png)] bg-repeat opacity-[0.54] pointer-events-none z-0' />
        <div className='relative z-10 flex flex-col min-h-screen'>
          <PublicNav />

          {/* Content */}
          <main className='flex-1'>{children}</main>

          {/* Footer */}
          <footer className='border-t border-cream-mid bg-cream py-8 mt-auto'>
            <div className='max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4'>
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
              <a
                href='https://www.instagram.com/fescuegolfclub'
                target='_blank'
                rel='noopener noreferrer'
                aria-label='Follow us on Instagram'
                className='text-navy/30 hover:text-navy/60 transition-colors'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  aria-hidden='true'
                >
                  <rect width='20' height='20' x='2' y='2' rx='5' ry='5' />
                  <circle cx='12' cy='12' r='4' />
                  <circle cx='17.5' cy='6.5' r='0.5' fill='currentColor' stroke='none' />
                </svg>
              </a>
            </div>
          </footer>
        </div>
      </div>

      <CartDrawer />
    </CartProvider>
  );
}
