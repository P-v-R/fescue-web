# Sanity Setup Guide

This guide walks through creating a Sanity project and wiring it into Fescue.

---

## 1. Create a Sanity Project

1. Go to [sanity.io/manage](https://sanity.io/manage) and sign in (or create an account)
2. Click **Create new project**
3. Name it `fescue` (or `fescue-production`)
4. Choose dataset name: `production`
5. Choose a plan — the **Free tier** supports up to 10 editors, which is fine for a club this size

Repeat for staging if you want a separate Sanity dataset for staging (recommended):
- Name: `fescue-staging`
- Dataset: `production` (or `staging` — must match your env var)

---

## 2. Fill In Environment Variables

From [sanity.io/manage](https://sanity.io/manage) → your project → **API**:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Settings → API → Project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` (default) |
| `SANITY_API_TOKEN` | Settings → API → Tokens → Add API token |

For `SANITY_API_TOKEN`:
1. Go to **API → Tokens → Add API token**
2. Name: `fescue-web-server`
3. Permissions: **Editor** (needed to create/update documents)
4. Copy the token — it only shows once

Add to `.env.local` for local dev, and to Vercel environment variables for staging/production.

---

## 3. Access the Studio

The Sanity Studio is embedded in the app at `/studio`. It's protected — only members with
`is_admin = true` can access it.

After deploying (or running `pnpm dev` locally):
1. Sign into the app with your admin account at `/login`
2. Navigate to `/studio`
3. You'll see the Fescue Club Admin studio with two sections:
   - **Bulletin Board** — create and manage bulletin posts
   - **Social Calendar** — create and manage social events

---

## 4. Generate TypeScript Types (after setup)

Once your Sanity project is created and `NEXT_PUBLIC_SANITY_PROJECT_ID` is set in `.env.local`,
run this to generate accurate TypeScript types from your actual schema:

```bash
pnpm exec sanity typegen generate
```

This outputs types to `sanity.types.ts` at the project root. You can then replace the manual
types in `lib/sanity/types.ts` with imports from the generated file.

Add to `package.json` scripts for easy re-running:
```json
"typegen": "sanity typegen generate"
```

---

## 5. Configure CORS for Your Domains

In [sanity.io/manage](https://sanity.io/manage) → your project → **API → CORS Origins**:

Add:
- `http://localhost:3000` (local dev)
- `https://staging.fescuegolf.com` (staging)
- `https://fescuegolf.com` (production)

This allows the Studio embedded in your Next.js app to make API calls to Sanity.

---

## 6. Content Model Summary

### Bulletin Post

| Field | Type | Notes |
|---|---|---|
| `title` | string | Required |
| `body` | block (rich text) | Supports bold, italic, links |
| `pinned` | boolean | Pinned posts appear first on dashboard |
| `publishedAt` | datetime | Controls sort order |

### Social Event

| Field | Type | Notes |
|---|---|---|
| `title` | string | Required |
| `description` | block (rich text) | |
| `date` | datetime | Required, used for calendar display |
| `location` | string | e.g. "Bay 3", "Rooftop" |
| `image` | image (hotspot) | Optional event photo |
| `rsvpUrl` | url | Optional external RSVP link |

---

## 7. Image CDN

Sanity serves images from `cdn.sanity.io`. The `next.config.ts` already allows this domain
for `next/image`. Use the `urlFor()` helper from `lib/sanity/client.ts`:

```ts
import { urlFor } from '@/lib/sanity/client'

// In a component:
<Image
  src={urlFor(event.image).width(800).height(400).url()}
  alt={event.title}
  width={800}
  height={400}
/>
```
