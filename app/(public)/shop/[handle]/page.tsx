import { notFound } from 'next/navigation'
import Link from 'next/link'
import { isShopifyConfigured, getProductByHandle, getAllProducts } from '@/lib/shopify'
import { ProductClient } from './product-client'

type Props = {
  params: Promise<{ handle: string }>
}

export async function generateStaticParams() {
  if (!isShopifyConfigured()) return []

  try {
    const products = await getAllProducts()
    return products.map((p) => ({ handle: p.handle }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props) {
  const { handle } = await params

  if (!isShopifyConfigured()) {
    return { title: 'Shop — Fescue' }
  }

  try {
    const product = await getProductByHandle(handle)
    if (!product) return { title: 'Product Not Found — Fescue' }
    return { title: `${product.title} — Fescue` }
  } catch {
    return { title: 'Shop — Fescue' }
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params

  if (!isShopifyConfigured()) {
    notFound()
  }

  const product = await getProductByHandle(handle)

  if (!product) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 font-mono text-label uppercase tracking-[0.2em] text-sand">
        <Link href="/shop" className="hover:text-navy transition-colors">
          Shop
        </Link>
        <span>›</span>
        <span className="text-navy">{product.title}</span>
      </nav>

      <ProductClient product={product} />
    </div>
  )
}
