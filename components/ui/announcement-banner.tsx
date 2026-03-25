'use client';

import { useState, useEffect } from 'react';
import type { SanityAnnouncement } from '@/lib/sanity/types';

const SEPARATOR = '\u00A0\u00A0\u00A0◆\u00A0\u00A0\u00A0'; // spaced diamond

export function AnnouncementBanner({ announcement }: { announcement: SanityAnnouncement }) {
  const [visible, setVisible] = useState(false);
  const dismissKey = `announcement-dismissed-${announcement.message}`;

  // sessionStorage: dismissed for this tab session only — reappears on hard refresh
  useEffect(() => {
    if (!sessionStorage.getItem(dismissKey)) setVisible(true);
  }, [dismissKey]);

  function dismiss() {
    sessionStorage.setItem(dismissKey, '1');
    setVisible(false);
  }

  if (!visible) return null;

  const isAlert = announcement.type === 'alert';

  const unit = `${announcement.message}${SEPARATOR}`;
  const repeats = Math.max(6, Math.ceil(120 / announcement.message.length));
  const tickerContent = unit.repeat(repeats);
  const duration = Math.max(30, announcement.message.length * 0.9);

  return (
    <div
      className={[
        'relative flex items-stretch overflow-hidden border-b',
        isAlert
          ? 'bg-[#7a1a10] border-[#9b2a1a]'
          : 'bg-[#0d2347] border-[#1a3560]',
      ].join(' ')}
      style={{ height: '36px' }}
    >
      {/* Left badge — pinned */}
      <div
        className={[
          'flex-shrink-0 flex items-center px-4 border-r z-10',
          isAlert
            ? 'bg-[#9b2a1a] border-[#b83828]'
            : 'bg-[#162d5a] border-[#243f78]',
        ].join(' ')}
      >
        <span
          className={[
            'font-mono text-label uppercase tracking-[0.28em] font-medium',
            isAlert ? 'text-red-200' : 'text-gold',
          ].join(' ')}
        >
          {isAlert ? 'Alert' : 'Announcement'}
        </span>
      </div>

      {/* Scrolling ticker track */}
      <div className='flex-1 overflow-hidden flex items-center relative'>
        {/* Fade edges */}
        <div
          className={[
            'absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none',
            isAlert
              ? 'bg-gradient-to-r from-[#7a1a10] to-transparent'
              : 'bg-gradient-to-r from-[#0d2347] to-transparent',
          ].join(' ')}
        />
        <div
          className={[
            'absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none',
            isAlert
              ? 'bg-gradient-to-l from-[#7a1a10] to-transparent'
              : 'bg-gradient-to-l from-[#0d2347] to-transparent',
          ].join(' ')}
        />

        <div
          className='flex items-center whitespace-nowrap will-change-transform'
          style={{ animation: `ticker-scroll ${duration}s linear infinite` }}
        >
          <span
            className={[
              'font-mono text-label uppercase tracking-[0.2em]',
              isAlert ? 'text-red-100' : 'text-cream/80',
            ].join(' ')}
          >
            {tickerContent}{tickerContent}
          </span>
        </div>
      </div>

      {/* Dismiss button — pinned right */}
      <button
        onClick={dismiss}
        aria-label='Dismiss announcement'
        className={[
          'flex-shrink-0 flex items-center px-4 border-l transition-opacity hover:opacity-60 z-10',
          isAlert
            ? 'border-[#9b2a1a] text-red-200'
            : 'border-[#243f78] text-cream/50',
        ].join(' ')}
      >
        <svg width='12' height='12' viewBox='0 0 12 12' fill='none'>
          <path d='M1 1l10 10M11 1L1 11' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
        </svg>
      </button>
    </div>
  );
}
