'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CartIcon } from '@/components/shop/cart-icon';

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/location', label: 'Locations' },
  { href: '/contact', label: 'Membership' },
  { href: '/shop', label: 'Shop' },
];

export function PublicNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className='relative border-b border-white/10 bg-navy-dark sticky top-0 z-30'>
      <div className='absolute inset-0 bg-[url(/soft-wallpaper.png)] bg-repeat opacity-[0.08] pointer-events-none' />
      <div className='relative z-10 max-w-6xl mx-auto px-4 sm:px-8 h-14 grid grid-cols-3 items-center'>
        {/* Left: Logo */}
        <Link href='/' className='shrink-0 justify-self-start'>
          <Image
            src='/logo-quail.png'
            alt='Fescue Golf Club'
            width={28}
            height={28}
            className='object-contain'
            priority
          />
        </Link>

        {/* Center: Desktop nav links */}
        <nav className='hidden sm:flex items-center justify-center gap-8'>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className='font-mono text-label uppercase tracking-[0.22em] text-cream/60 hover:text-cream transition-colors'
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: cart + member login + mobile hamburger */}
        <div className='flex items-center gap-4 justify-self-end'>
          <CartIcon />
          <Link
            href='/login'
            className='hidden sm:block font-mono text-label uppercase tracking-[0.22em] text-gold hover:text-cream transition-colors'
          >
            Member Login
          </Link>
          <button
            className='sm:hidden p-2 text-cream/60 hover:text-cream transition-colors'
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
              >
                <line x1='18' y1='6' x2='6' y2='18' />
                <line x1='6' y1='6' x2='18' y2='18' />
              </svg>
            ) : (
              <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
              >
                <line x1='3' y1='6' x2='21' y2='6' />
                <line x1='3' y1='12' x2='21' y2='12' />
                <line x1='3' y1='18' x2='21' y2='18' />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className='relative sm:hidden bg-navy-dark border-t border-white/10 px-4 py-3 space-y-1'>
          <div className='absolute inset-0 bg-[url(/soft-wallpaper.png)] bg-repeat opacity-[0.08] pointer-events-none' />
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className='flex items-center font-mono text-label uppercase tracking-[0.22em] text-cream/60 py-3 border-b border-white/10 last:border-0 hover:text-cream transition-colors'
            >
              {label}
            </Link>
          ))}
          <Link
            href='/login'
            className='flex items-center font-mono text-label uppercase tracking-[0.22em] text-gold py-3 hover:text-cream transition-colors'
          >
            Member Login →
          </Link>
        </div>
      )}
    </header>
  );
}
