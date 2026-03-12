'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/components/shop/cart-provider'
import type { ShopifyProduct, ShopifyProductVariant, ShopifyImage } from '@/lib/shopify/types'

type Props = {
  product: ShopifyProduct
}

export function ProductClient({ product }: Props) {
  const variants = product.variants.nodes
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? '')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        (variants[0]?.selectedOptions ?? []).map((o) => [o.name, o.value]),
      ),
  )
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const { addItem } = useCart()

  const images = product.images.nodes.length > 0 ? product.images.nodes : []

  function selectOption(name: string, value: string) {
    const next = { ...selectedOptions, [name]: value }
    setSelectedOptions(next)

    // Find matching variant
    const match = variants.find((v) =>
      v.selectedOptions.every((o) => next[o.name] === o.value),
    )
    if (match) setSelectedVariantId(match.id)
  }

  const currentVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0]
  const isAvailable = currentVariant?.availableForSale ?? false

  async function handleAddToCart() {
    if (!selectedVariantId || !isAvailable) return
    setIsAdding(true)
    try {
      await addItem(selectedVariantId, 1)
    } finally {
      setIsAdding(false)
    }
  }

  const comparePrice = currentVariant?.compareAtPrice
  const price = currentVariant?.price

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
      {/* Images */}
      <div>
        <div className="relative aspect-square bg-cream-light border border-cream-mid overflow-hidden mb-3">
          {images[activeImageIndex] ? (
            <Image
              src={images[activeImageIndex].url}
              alt={images[activeImageIndex].altText ?? product.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-label uppercase tracking-[0.15em] text-sand">
                No image
              </span>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <Thumbnail
                key={i}
                image={img}
                isActive={i === activeImageIndex}
                onClick={() => setActiveImageIndex(i)}
                alt={`${product.title} — view ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex flex-col">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-2">
          Fescue Club
        </p>
        <h1 className="font-serif text-3xl font-light text-navy leading-tight">
          {product.title}
        </h1>

        {/* Price */}
        <div className="flex items-baseline gap-3 mt-4 mb-6">
          {price && (
            <span className="font-serif text-xl text-navy">
              {formatMoney(price.amount, price.currencyCode)}
            </span>
          )}
          {comparePrice && parseFloat(comparePrice.amount) > parseFloat(price?.amount ?? '0') && (
            <span className="font-mono text-label text-sand line-through">
              {formatMoney(comparePrice.amount, comparePrice.currencyCode)}
            </span>
          )}
        </div>

        <div className="w-12 h-px bg-gold mb-6" />

        {/* Options */}
        {product.options
          .filter((opt) => !(opt.values.length === 1 && opt.values[0] === 'Default Title'))
          .map((option) => (
            <div key={option.name} className="mb-5">
              <p className="font-mono text-label uppercase tracking-[0.2em] text-navy mb-2">
                {option.name}:{' '}
                <span className="text-gold">{selectedOptions[option.name]}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.name] === value
                  const matchingVariant = variants.find((v) =>
                    v.selectedOptions.every(
                      (o) => (o.name === option.name ? o.value === value : selectedOptions[o.name] === o.value),
                    ),
                  )
                  const available = matchingVariant?.availableForSale ?? false

                  return (
                    <button
                      key={value}
                      onClick={() => selectOption(option.name, value)}
                      disabled={!available}
                      className={[
                        'px-3 py-1.5 font-mono text-label uppercase tracking-[0.15em] border transition-colors',
                        isSelected
                          ? 'bg-navy text-cream border-navy'
                          : 'bg-white text-navy border-cream-mid hover:border-navy',
                        !available ? 'opacity-40 cursor-not-allowed' : '',
                      ].join(' ')}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          disabled={!isAvailable || isAdding}
          className="mt-2 w-full bg-navy text-cream font-mono text-label uppercase tracking-[0.22em] py-4 transition-opacity hover:opacity-90 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? 'Adding…' : isAvailable ? 'Add to Cart' : 'Sold Out'}
        </button>

        {/* Description */}
        {product.description && (
          <div className="mt-8 pt-6 border-t border-cream-mid">
            <p className="font-mono text-label uppercase tracking-[0.2em] text-gold mb-3">
              Details
            </p>
            <p className="font-serif text-sm text-navy/80 leading-relaxed font-light">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Thumbnail({
  image,
  isActive,
  onClick,
  alt,
}: {
  image: ShopifyImage
  isActive: boolean
  onClick: () => void
  alt: string
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'relative w-16 h-16 flex-shrink-0 border overflow-hidden transition-colors',
        isActive ? 'border-navy' : 'border-cream-mid hover:border-sand',
      ].join(' ')}
    >
      <Image src={image.url} alt={alt} fill className="object-cover" sizes="64px" />
    </button>
  )
}

function formatMoney(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount))
}
