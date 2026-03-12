export { isShopifyConfigured, shopifyFetch } from './client'
export {
  getAllProducts,
  getProductByHandle,
  createCart,
  getCart,
  addToCart,
  updateCartLine,
  removeFromCart,
} from './queries'
export type { ShopifyProduct, ShopifyProductVariant, ShopifyImage, ShopifyMoney, Cart, CartItem } from './types'
