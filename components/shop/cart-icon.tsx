'use client'

import { useCart } from './cart-provider'

export function CartIcon() {
  const { cart, openCart } = useCart()
  const count = cart?.totalQuantity ?? 0

  return (
    <button
      onClick={openCart}
      className="relative flex items-center gap-1.5 font-mono text-label uppercase tracking-[0.2em] text-cream/60 hover:text-cream transition-colors"
      aria-label={`Open cart${count > 0 ? ` — ${count} item${count > 1 ? 's' : ''}` : ''}`}
    >
      {/* Bag icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>

      {count > 0 && (
        <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-label font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
