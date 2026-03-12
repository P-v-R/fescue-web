# Shopify Setup Guide

The Fescue merch store is built on Shopify's Storefront API. When the env vars aren't set the
shop page gracefully shows a "Coming Soon" placeholder — no errors.

---

## 1. Create a Shopify account

1. Go to [shopify.com](https://www.shopify.com) → **Start free trial**
2. Choose a plan (Basic is fine for a club shop)
3. Pick a store name — e.g. `fescue-club` (your domain will be `fescue-club.myshopify.com`)

---

## 2. Create a Storefront API access token

The app uses the **Storefront API** (public-facing), NOT the Admin API.

1. In Shopify Admin → **Apps** → **Develop apps** → **Create an app**
2. Name it `Fescue Web`
3. Go to **API credentials** → under **Storefront API**, click **Configure**
4. Enable these access scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_checkouts`
   - `unauthenticated_write_customers`
5. Click **Save** → **Install app** → **Install**
6. Copy the **Storefront API access token** (shown once — save it!)

---

## 3. Add environment variables

Update `.env.local` (development) and your hosting provider (production):

```env
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=fescue-club.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_token_here
```

**Notes:**
- The domain is just the `.myshopify.com` subdomain — no `https://`
- Both vars are prefixed `NEXT_PUBLIC_` so they're available in the browser (needed for cart
  operations). The Storefront API token has limited read-only + cart scope — this is safe.
- If you use a custom domain (e.g. `shop.fescuegolf.com`), still use the `.myshopify.com`
  subdomain for the API domain.

---

## 4. Add products in Shopify

1. Shopify Admin → **Products** → **Add product**
2. Fill in title, description, images, price, and variants (size, color, etc.)
3. Set inventory and enable "Track quantity" if needed
4. **Publish** the product (set status to Active)

The `/shop` page fetches the 50 most recently created products.

---

## 5. Staging vs Production

Since the Storefront API token is public, you don't need separate Shopify accounts for staging
and production. Use the same store — just ensure products are in **Active** status.

If you want a separate staging store:
1. Create a second Shopify store (free development stores available via Shopify Partners)
2. Add separate env vars to your staging environment

---

## 6. Checkout

The "Checkout" button in the cart drawer goes to Shopify's hosted checkout (the `checkoutUrl`
returned by the Cart API). Shopify handles payment, shipping, and order confirmation.

To brand the checkout:
- Shopify Admin → **Online Store** → **Themes** → **Customize**
- Under **Theme settings** → **Colors** / **Typography** — match Fescue brand colors

---

## 7. Verify the setup

After adding env vars and restarting the dev server:

1. Visit `http://localhost:3000/shop` — should show your product grid
2. Click a product — should show images, variants, and Add to Cart button
3. Add to cart — drawer should slide in with the item
4. Click Checkout — should redirect to Shopify's hosted checkout

---

## 8. Webhooks (optional)

If you want to invalidate Next.js cache when products change:

1. Shopify Admin → **Settings** → **Notifications** → **Webhooks**
2. Add a webhook for `products/update` pointing to your API route
3. Create `app/api/shopify-webhook/route.ts` and call `revalidatePath('/shop')`

This is optional — products already revalidate every hour (`revalidate: 3600`).
