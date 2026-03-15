import Image from 'next/image';
import { CartProvider } from '@/components/shop/cart-provider';
import { CartDrawer } from '@/components/shop/cart-drawer';
import { PublicNav } from '@/components/ui/public-nav';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className='relative min-h-screen bg-cream flex flex-col'>
        <div className='fixed inset-0 bg-[url(/soft-wallpaper.png)] bg-repeat opacity-80 pointer-events-none z-0' />
        <div className='relative z-10 flex flex-col min-h-screen'>
        <PublicNav />

        {/* Content */}
        <main className='flex-1'>{children}</main>

        {/* Footer */}
        <footer className='border-t border-cream-mid bg-cream py-8 mt-auto'>
          <div className='max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4'>
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
      </div>

      <CartDrawer />
    </CartProvider>
  );
}
