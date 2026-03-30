'use client';

import { useEffect, useState } from 'react';

const THEMES = [
  // Current — deep Masters green
  { name: 'Augusta',   navy: '#004225', navyDark: '#002918', navyMid: '#1a5535' },
  // Very dark, near-black forest green
  { name: 'Pinehurst', navy: '#0D2818', navyDark: '#07160d', navyMid: '#1a3d27' },
  // Classic hunter green — slightly warmer/brighter
  { name: 'Hunter',    navy: '#355E3B', navyDark: '#1e3d24', navyMid: '#4a7a52' },
  // Teal-leaning country club green
  { name: 'Pebble',    navy: '#1B4D3E', navyDark: '#0e3029', navyMid: '#2d6655' },
  // Olive-forward, old-money private club
  { name: 'Cypress',   navy: '#3A5A2A', navyDark: '#233818', navyMid: '#4e763a' },
] as const;

const LS_KEY = 'fescue-theme';

function applyTheme(index: number) {
  const t = THEMES[index];
  const root = document.documentElement;
  root.style.setProperty('--navy', t.navy);
  root.style.setProperty('--navy-dark', t.navyDark);
  root.style.setProperty('--navy-mid', t.navyMid);
}

export function ThemeSwitcher() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    const initial = saved ? parseInt(saved, 10) : 0;
    setIdx(initial);
    applyTheme(initial);
  }, []);

  function cycle() {
    const next = (idx + 1) % THEMES.length;
    setIdx(next);
    applyTheme(next);
    localStorage.setItem(LS_KEY, String(next));
  }

  const theme = THEMES[idx];

  return (
    <button
      onClick={cycle}
      title='Cycle theme (preview only)'
      className='hidden sm:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cream/40 hover:text-cream/70 transition-colors border border-white/10 rounded px-2 py-1'
    >
      <span
        className='w-2.5 h-2.5 rounded-full border border-white/20 shrink-0'
        style={{ backgroundColor: theme.navy }}
      />
      {theme.name}
    </button>
  );
}
