import Image from 'next/image'
import { CartProvider } from '@/components/shop/cart-provider'
import { CartDrawer } from '@/components/shop/cart-drawer'
import { PublicNav } from '@/components/ui/public-nav'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-cream flex flex-col">
        <PublicNav />

        {/* Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-cream-mid bg-white py-8 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Image
              src="/logo-badge.png"
              alt="Fescue Golf Club"
              width={36}
              height={36}
              className="object-contain opacity-60"
            />
            <p className="font-mono text-label uppercase tracking-[0.2em] text-navy/30">
              © {new Date().getFullYear()} Fescue Golf Club. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      <CartDrawer />
    </CartProvider>
  )
}
