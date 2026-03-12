'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useCart } from './cart-provider'
import type { CartItem } from '@/lib/shopify/types'

export function CartDrawer() {
  const { cart, isOpen, isLoading, closeCart, updateItem, removeItem } = useCart()

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Escape key to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeCart])

  if (!isOpen) return null

  const items = cart?.items ?? []
  const isEmpty = items.length === 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy/40 z-40 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Shopping cart"
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-cream z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream-mid">
          <div>
            <p className="font-mono text-label uppercase tracking-[0.28em] text-gold">
              Fescue Club
            </p>
            <h2 className="font-serif text-xl font-light text-navy mt-0.5">Your Cart</h2>
          </div>
          <button
            onClick={closeCart}
            className="text-sand hover:text-navy transition-colors p-1"
            aria-label="Close cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-12 h-px bg-gold mb-6 mx-auto" />
              <p className="font-serif text-lg text-navy font-light">Your cart is empty</p>
              <p className="font-mono text-label uppercase tracking-[0.2em] text-sand mt-2">
                Browse the shop to add items
              </p>
              <button
                onClick={closeCart}
                className="mt-8 font-mono text-label uppercase tracking-[0.2em] text-gold hover:text-navy transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-cream-mid">
              {items.map((item) => (
                <CartLineItem
                  key={item.id}
                  item={item}
                  onUpdate={(qty) => updateItem(item.id, qty)}
                  onRemove={() => removeItem(item.id)}
                  disabled={isLoading}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && cart && (
          <div className="border-t border-cream-mid px-6 py-5 bg-white">
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-label uppercase tracking-[0.2em] text-sand">
                Subtotal
              </span>
              <span className="font-serif text-base text-navy">
                {formatMoney(cart.subtotal)}
              </span>
            </div>
            <p className="font-mono text-label text-sand mb-4">
              Shipping and taxes calculated at checkout
            </p>
            <a
              href={cart.checkoutUrl}
              className="block w-full text-center bg-navy text-cream font-mono text-label uppercase tracking-[0.2em] py-3.5 transition-opacity hover:opacity-90 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)]"
            >
              Checkout
            </a>
          </div>
        )}
      </div>
    </>
  )
}

function CartLineItem({
  item,
  onUpdate,
  onRemove,
  disabled,
}: {
  item: CartItem
  onUpdate: (qty: number) => void
  onRemove: () => void
  disabled: boolean
}) {
  return (
    <li className="py-4 flex gap-4">
      {/* Image */}
      <div className="relative w-16 h-16 flex-shrink-0 bg-cream-light border border-cream-mid overflow-hidden">
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.altText ?? item.productTitle}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-mono text-label text-sand uppercase">No img</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-serif text-sm text-navy font-light leading-tight truncate">
          {item.productTitle}
        </p>
        {item.variantTitle !== 'Default Title' && (
          <p className="font-mono text-label uppercase tracking-[0.15em] text-sand mt-0.5">
            {item.variantTitle}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          {/* Quantity */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdate(Math.max(0, item.quantity - 1))}
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center border border-cream-mid text-sand hover:text-navy hover:border-navy transition-colors disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="font-mono text-label w-5 text-center text-navy">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdate(item.quantity + 1)}
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center border border-cream-mid text-sand hover:text-navy hover:border-navy transition-colors disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <span className="font-serif text-sm text-navy">
            {formatMoney({
              amount: String(parseFloat(item.price.amount) * item.quantity),
              currencyCode: item.price.currencyCode,
            })}
          </span>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        disabled={disabled}
        className="self-start text-sand hover:text-navy transition-colors disabled:opacity-40 mt-0.5"
        aria-label={`Remove ${item.productTitle}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </li>
  )
}

function formatMoney({ amount, currencyCode }: { amount: string; currencyCode: string }): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount))
}
