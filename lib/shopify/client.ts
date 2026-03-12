export function isShopifyConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN &&
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN
  )
}

type ShopifyFetchOptions = {
  query: string
  variables?: Record<string, unknown>
  cache?: RequestCache
  revalidate?: number
}

type ShopifyResponse<T> = {
  data: T
  errors?: { message: string }[]
}

export async function shopifyFetch<T>({
  query,
  variables,
  cache = 'force-cache',
  revalidate,
}: ShopifyFetchOptions): Promise<T> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN

  if (!domain || !token) {
    throw new Error('Shopify is not configured. Set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN.')
  }

  const endpoint = `https://${domain}/api/2024-01/graphql.json`

  const nextOptions: { revalidate?: number; tags?: string[] } = {}
  if (revalidate !== undefined) nextOptions.revalidate = revalidate

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    cache: revalidate !== undefined ? 'no-store' : cache,
    next: revalidate !== undefined ? nextOptions : undefined,
  })

  if (!res.ok) {
    throw new Error(`Shopify API error: ${res.status} ${res.statusText}`)
  }

  const json: ShopifyResponse<T> = await res.json()

  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL error: ${json.errors[0].message}`)
  }

  return json.data
}
