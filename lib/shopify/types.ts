export type ShopifyImage = {
  url: string
  altText: string | null
  width: number
  height: number
}

export type ShopifyMoney = {
  amount: string
  currencyCode: string
}

export type ShopifyProductVariant = {
  id: string
  title: string
  availableForSale: boolean
  selectedOptions: { name: string; value: string }[]
  price: ShopifyMoney
  compareAtPrice: ShopifyMoney | null
}

export type ShopifyProduct = {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  featuredImage: ShopifyImage | null
  images: { nodes: ShopifyImage[] }
  priceRange: {
    minVariantPrice: ShopifyMoney
    maxVariantPrice: ShopifyMoney
  }
  variants: { nodes: ShopifyProductVariant[] }
  options: { name: string; values: string[] }[]
  tags: string[]
}

export type ShopifyCartLine = {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    product: {
      id: string
      handle: string
      title: string
      featuredImage: ShopifyImage | null
    }
    price: ShopifyMoney
    selectedOptions: { name: string; value: string }[]
  }
}

export type ShopifyCart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    subtotalAmount: ShopifyMoney
    totalAmount: ShopifyMoney
    totalTaxAmount: ShopifyMoney | null
  }
  lines: { nodes: ShopifyCartLine[] }
}

// Simplified types used in the app
export type CartItem = {
  id: string // line id
  quantity: number
  variantId: string
  variantTitle: string
  productHandle: string
  productTitle: string
  image: ShopifyImage | null
  price: ShopifyMoney
  selectedOptions: { name: string; value: string }[]
}

export type Cart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  subtotal: ShopifyMoney
  total: ShopifyMoney
  items: CartItem[]
}
