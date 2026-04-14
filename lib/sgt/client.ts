const BASE_URL = 'https://simulatorgolftour.com/sgt-api/club-admin/fescuegc'

type KeyCache = { key: string; expiresAt: number }
const cache: KeyCache = { key: '', expiresAt: 0 }
let keyFetchInFlight: Promise<string> | null = null

async function _fetchSgtApiKey(): Promise<string> {
  // If we have an existing key, try to refresh it (refresh takes the key, not credentials)
  if (cache.key) {
    const res = await fetch(`${BASE_URL}/apikey/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'api-key': cache.key }),
    })
    if (res.ok) {
      const json = await res.json()
      if (json.success) {
        cache.key = json.key
        cache.expiresAt = Date.now() + json.expires * 1000
        return cache.key
      }
    }
    // Refresh failed — clear and fall through to create
    cache.key = ''
    cache.expiresAt = 0
  }

  // No key or refresh failed — create a fresh one
  const createRes = await fetch(`${BASE_URL}/apikey/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      username: process.env.SGT_USERNAME!,
      password: process.env.SGT_PASSWORD!,
    }),
  })
  const createJson = await createRes.json()
  if (!createJson.success) throw new Error('SGT key creation failed — check SGT_USERNAME / SGT_PASSWORD env vars')
  cache.key = createJson.key
  cache.expiresAt = Date.now() + createJson.expires * 1000
  return cache.key
}

async function getSgtApiKey(): Promise<string> {
  // Return cached key if still valid (with 5-minute buffer)
  if (cache.key && Date.now() < cache.expiresAt - 5 * 60 * 1000) {
    return cache.key
  }
  // Deduplicate concurrent key fetches — all callers wait on the same request
  if (!keyFetchInFlight) {
    keyFetchInFlight = _fetchSgtApiKey().finally(() => { keyFetchInFlight = null })
  }
  return keyFetchInFlight
}

const SGT_TIMEOUT_MS = 5000
const SGT_RETRIES = 2

async function sgtFetchOnce(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SGT_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error(`SGT API error ${res.status}`)
    const json = await res.json()
    if (json === 'INVALID API KEY' || json?.message === 'INVALID API KEY') {
      cache.key = ''
      cache.expiresAt = 0
      throw new Error('SGT invalid API key — cache cleared, will re-auth on retry')
    }
    return json
  } finally {
    clearTimeout(timer)
  }
}

// Raw fetch with timeout + retry. Use for endpoints that don't follow the {success, data} shape.
export async function sgtFetch(
  path: string,
  params: Record<string, string> = {},
): Promise<unknown> {
  let lastError: unknown
  for (let attempt = 0; attempt < SGT_RETRIES; attempt++) {
    // Re-fetch the key on every attempt — clears stale key if previous attempt got INVALID API KEY
    const key = await getSgtApiKey()
    const url = new URL(`${BASE_URL}${path}`)
    url.searchParams.set('api-key', key)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    try {
      return await sgtFetchOnce(url.toString())
    } catch (err) {
      lastError = err
      // Short pause before retry — don't hammer a struggling API
      if (attempt < SGT_RETRIES - 1) await new Promise((r) => setTimeout(r, 500))
    }
  }
  throw lastError
}
