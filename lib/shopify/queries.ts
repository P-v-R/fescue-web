import { shopifyFetch } from './client'
import type { ShopifyProduct, ShopifyCart, Cart, CartItem } from './types'

// ─── Fragments ────────────────────────────────────────────────────────────────

const IMAGE_FRAGMENT = `
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`

const MONEY_FRAGMENT = `
  fragment MoneyFields on MoneyV2 {
    amount
    currencyCode
  }
`

const PRODUCT_VARIANT_FRAGMENT = `
  fragment VariantFields on ProductVariant {
    id
    title
    availableForSale
    selectedOptions { name value }
    price { ...MoneyFields }
    compareAtPrice { ...MoneyFields }
  }
`

const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    featuredImage { ...ImageFields }
    images(first: 10) { nodes { ...ImageFields } }
    priceRange {
      minVariantPrice { ...MoneyFields }
      maxVariantPrice { ...MoneyFields }
    }
    variants(first: 100) { nodes { ...VariantFields } }
    options { name values }
    tags
  }
`

const CART_LINE_FRAGMENT = `
  fragment CartLineFields on CartLine {
    id
    quantity
    merchandise {
      ... on ProductVariant {
        id
        title
        price { ...MoneyFields }
        selectedOptions { name value }
        product {
          id
          handle
          title
          featuredImage { ...ImageFields }
        }
      }
    }
  }
`

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { ...MoneyFields }
      totalAmount { ...MoneyFields }
      totalTaxAmount { ...MoneyFields }
    }
    lines(first: 100) { nodes { ...CartLineFields } }
  }
`

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeCart(cart: ShopifyCart): Cart {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
    subtotal: cart.cost.subtotalAmount,
    total: cart.cost.totalAmount,
    items: cart.lines.nodes.map(
      (line): CartItem => ({
        id: line.id,
        quantity: line.quantity,
        variantId: line.merchandise.id,
        variantTitle: line.merchandise.title,
        productHandle: line.merchandise.product.handle,
        productTitle: line.merchandise.product.title,
        image: line.merchandise.product.featuredImage,
        price: line.merchandise.price,
        selectedOptions: line.merchandise.selectedOptions,
      }),
    ),
  }
}

// ─── Product queries ──────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<ShopifyProduct[]> {
  const data = await shopifyFetch<{ products: { nodes: ShopifyProduct[] } }>({
    query: `
      ${IMAGE_FRAGMENT}
      ${MONEY_FRAGMENT}
      ${PRODUCT_VARIANT_FRAGMENT}
      ${PRODUCT_FRAGMENT}
      query GetAllProducts {
        products(first: 50, sortKey: CREATED_AT, reverse: true) {
          nodes { ...ProductFields }
        }
      }
    `,
    revalidate: 3600,
  })

  return data.products.nodes
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const data = await shopifyFetch<{ productByHandle: ShopifyProduct | null }>({
    query: `
      ${IMAGE_FRAGMENT}
      ${MONEY_FRAGMENT}
      ${PRODUCT_VARIANT_FRAGMENT}
      ${PRODUCT_FRAGMENT}
      query GetProductByHandle($handle: String!) {
        productByHandle(handle: $handle) { ...ProductFields }
      }
    `,
    variables: { handle },
    revalidate: 3600,
  })

  return data.productByHandle
}

// ─── Cart mutations ───────────────────────────────────────────────────────────

export async function createCart(): Promise<Cart> {
  const data = await shopifyFetch<{ cartCreate: { cart: ShopifyCart } }>({
    query: `
      ${IMAGE_FRAGMENT}
      ${MONEY_FRAGMENT}
      ${CART_LINE_FRAGMENT}
      ${CART_FRAGMENT}
      mutation CartCreate {
        cartCreate {
          cart { ...CartFields }
        }
      }
    `,
    cache: 'no-store',
  })

  return normalizeCart(data.cartCreate.cart)
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await shopifyFetch<{ cart: ShopifyCart | null }>({
    query: `
      ${IMAGE_FRAGMENT}
      ${MONEY_FRAGMENT}
      ${CART_LINE_FRAGMENT}
      ${CART_FRAGMENT}
      query GetCart($cartId: ID!) {
        cart(id: $cartId) { ...CartFields }
      }
    `,
    variables: { cartId },
    cache: 'no-store',
  })

  if (!data.cart) return null
  return normalizeCart(data.cart)
}

export async function addToCart(cartId: string, variantId: string, quantity = 1): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesAdd: { cart: ShopifyCart } }>({
    query: `
      ${IMAGE_FRAGMENT}
      ${MONEY_FRAGMENT}
      ${CART_LINE_FRAGMENT}
      ${CART_FRAGMENT}
      mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
        }
      }
    `,
    variables: { cartId, lines: [{ merchandiseId: variantId, quantity }] },
    cache: 'no-store',
  })

  return normalizeCart(data.cartLinesAdd.cart)
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesUpdate: { cart: ShopifyCart } }>({
    query: `
      ${IMAGE_FRAGMENT}
      ${MONEY_FRAGMENT}
      ${CART_LINE_FRAGMENT}
      ${CART_FRAGMENT}
      mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
        }
      }
    `,
    variables: { cartId, lines: [{ id: lineId, quantity }] },
    cache: 'no-store',
  })

  return normalizeCart(data.cartLinesUpdate.cart)
}

export async function removeFromCart(cartId: string, lineId: string): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesRemove: { cart: ShopifyCart } }>({
    query: `
      ${IMAGE_FRAGMENT}
      ${MONEY_FRAGMENT}
      ${CART_LINE_FRAGMENT}
      ${CART_FRAGMENT}
      mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ...CartFields }
        }
      }
    `,
    variables: { cartId, lineIds: [lineId] },
    cache: 'no-store',
  })

  return normalizeCart(data.cartLinesRemove.cart)
}
