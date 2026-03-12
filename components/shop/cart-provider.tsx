'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { Cart } from '@/lib/shopify/types'

const CART_COOKIE = 'fescue_cart_id'

type CartContextValue = {
  cart: Cart | null
  isLoading: boolean
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateItem: (lineId: string, quantity: number) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Hydrate cart from cookie on mount
  useEffect(() => {
    async function hydrate() {
      const cartId = getCookie(CART_COOKIE)
      if (!cartId) return

      try {
        const { getCart } = await import('@/lib/shopify/queries')
        const existing = await getCart(cartId)
        if (existing) {
          setCart(existing)
        } else {
          // Cart expired on Shopify side — clear cookie
          document.cookie = `${CART_COOKIE}=; max-age=0; path=/`
        }
      } catch {
        // Shopify not configured or network error — silently ignore
      }
    }

    hydrate()
  }, [])

  const ensureCart = useCallback(async (): Promise<string> => {
    if (cart?.id) return cart.id

    const { createCart } = await import('@/lib/shopify/queries')
    const newCart = await createCart()
    setCart(newCart)
    setCookie(CART_COOKIE, newCart.id)
    return newCart.id
  }, [cart])

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      setIsLoading(true)
      try {
        const cartId = await ensureCart()
        const { addToCart } = await import('@/lib/shopify/queries')
        const updated = await addToCart(cartId, variantId, quantity)
        setCart(updated)
        setIsOpen(true)
      } finally {
        setIsLoading(false)
      }
    },
    [ensureCart],
  )

  const updateItem = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart) return
      setIsLoading(true)
      try {
        const { updateCartLine } = await import('@/lib/shopify/queries')
        const updated = await updateCartLine(cart.id, lineId, quantity)
        setCart(updated)
      } finally {
        setIsLoading(false)
      }
    },
    [cart],
  )

  const removeItem = useCallback(
    async (lineId: string) => {
      if (!cart) return
      setIsLoading(true)
      try {
        const { removeFromCart } = await import('@/lib/shopify/queries')
        const updated = await removeFromCart(cart.id, lineId)
        setCart(updated)
      } finally {
        setIsLoading(false)
      }
    },
    [cart],
  )

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateItem,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
