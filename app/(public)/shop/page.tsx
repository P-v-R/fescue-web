import Link from 'next/link'
import Image from 'next/image'
import { isShopifyConfigured, getAllProducts } from '@/lib/shopify'
import type { ShopifyProduct } from '@/lib/shopify'

export const metadata = {
  title: 'Shop — Fescue',
}

export default async function ShopPage() {
  if (!isShopifyConfigured()) {
    return <ShopComingSoon />
  }

  let products: ShopifyProduct[] = []
  try {
    products = await getAllProducts()
  } catch {
    return <ShopError />
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-1">
          Fescue Club
        </p>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy">Club Shop</h1>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-serif text-xl text-navy font-light">No products yet</p>
          <p className="font-mono text-label uppercase tracking-[0.2em] text-sand mt-2">
            Check back soon
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: ShopifyProduct }) {
  const price = product.priceRange.minVariantPrice
  const image = product.featuredImage

  return (
    <Link href={`/shop/${product.handle}`} className="group block">
      {/* Image */}
      <div className="relative aspect-square bg-cream-light border border-cream-mid overflow-hidden mb-3">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-mono text-label uppercase tracking-[0.15em] text-sand">
              No image
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/10 transition-colors duration-300" />
      </div>

      {/* Info */}
      <p className="font-serif text-sm text-navy font-light leading-tight group-hover:text-gold transition-colors">
        {product.title}
      </p>
      <p className="font-mono text-label text-sand mt-1">
        {formatMoney(price.amount, price.currencyCode)}
      </p>
    </Link>
  )
}

function ShopComingSoon() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <div className="mb-10">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-1">
          Fescue Club
        </p>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy">Club Shop</h1>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      <div className="bg-white border border-cream-mid p-12 text-center max-w-md mx-auto mt-16">
        <div className="w-8 h-px bg-gold mx-auto mb-6" />
        <p className="font-serif text-2xl text-navy font-light mb-3">Coming Soon</p>
        <p className="font-mono text-label uppercase tracking-[0.2em] text-sand">
          The Fescue shop is currently being set up.
          <br />
          Check back soon for club merchandise.
        </p>
        <div className="w-8 h-px bg-gold mx-auto mt-6" />
      </div>
    </div>
  )
}

function ShopError() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <div className="text-center py-20">
        <p className="font-serif text-xl text-navy font-light">Unable to load products</p>
        <p className="font-mono text-label uppercase tracking-[0.2em] text-sand mt-2">
          Please try again later
        </p>
      </div>
    </div>
  )
}

function formatMoney(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount))
}
