'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/(member)/account/actions';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/reservations', label: 'Reservations' },
  { href: '/members', label: 'Members' },
  { href: '/account', label: 'Account' },
];

type Props = {
  memberName: string;
  isAdmin: boolean;
};

export function MemberNav({ memberName, isAdmin }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const allLinks = [
    ...NAV_LINKS,
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <nav className='bg-navy-dark border-b border-[rgba(184,150,60,0.12)] relative z-30'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 h-[56px] sm:h-[60px] flex items-center gap-4 sm:gap-8'>
        {/* Logo */}
        <Link href='/dashboard' className='shrink-0'>
          <span className='flex items-center justify-center overflow-hidden'>
            <Image
              src='/logo-quail.png'
              alt='Fescue Golf Club'
              width={28}
              height={28}
              className='object-contain'
              priority
            />
          </span>
        </Link>

        {/* Gold dot separator */}
        <span className='w-1 h-1 bg-gold/40 rotate-45 shrink-0' />

        {/* Desktop nav links */}
        <div className='hidden sm:flex items-center gap-6 flex-1'>
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'font-mono text-label uppercase tracking-[0.2em] transition-colors duration-200 relative pb-0.5',
                  isActive ? 'text-cream' : 'text-cream/50 hover:text-cream/75',
                ].join(' ')}
              >
                {label}
                {isActive && (
                  <span className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-gold/80 to-sage/60' />
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href='/admin'
              className={[
                'font-mono text-label uppercase tracking-[0.2em] transition-colors duration-200 relative pb-0.5',
                pathname.startsWith('/admin')
                  ? 'text-gold'
                  : 'text-gold/50 hover:text-gold/80',
              ].join(' ')}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Desktop: member name + sign out */}
        <div className='hidden sm:flex items-center gap-4 shrink-0 ml-auto'>
          <span className='font-serif italic text-label text-cream/50'>
            {memberName}
          </span>
          <form action={logoutAction}>
            <button
              type='submit'
              className='font-mono text-label uppercase tracking-[0.22em] text-gold/70 border border-gold/25 px-3.5 py-1.5 hover:text-gold hover:border-gold/50 transition-colors duration-200'
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* Mobile: hamburger */}
        <button
          className='sm:hidden ml-auto p-2 text-cream/60 hover:text-cream transition-colors'
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? (
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'>
              <line x1='18' y1='6' x2='6' y2='18' />
              <line x1='6' y1='6' x2='18' y2='18' />
            </svg>
          ) : (
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'>
              <line x1='3' y1='6' x2='21' y2='6' />
              <line x1='3' y1='12' x2='21' y2='12' />
              <line x1='3' y1='18' x2='21' y2='18' />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className='sm:hidden bg-navy-dark border-t border-[rgba(184,150,60,0.12)] px-4 py-4 space-y-1'>
          {allLinks.map(({ href, label }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center font-mono text-label uppercase tracking-[0.2em] py-3 border-b border-[rgba(184,150,60,0.08)] transition-colors',
                  isActive ? 'text-cream' : 'text-cream/50',
                ].join(' ')}
              >
                {label}
                {isActive && (
                  <span className='ml-auto w-1 h-1 bg-gold rotate-45' />
                )}
              </Link>
            );
          })}

          {/* Member name + sign out */}
          <div className='pt-3 flex items-center justify-between'>
            <span className='font-serif italic text-label text-cream/40'>
              {memberName}
            </span>
            <form action={logoutAction}>
              <button
                type='submit'
                className='font-mono text-label uppercase tracking-[0.22em] text-gold/70 border border-gold/25 px-4 py-2 hover:text-gold hover:border-gold/50 transition-colors'
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
