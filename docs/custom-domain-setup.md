# Custom Domain Setup

Track what to update when pointing a custom domain at staging or production.

## Domains

| Environment | URL |
|-------------|-----|
| Staging | `https://staging.fescuegolfclub.com` |
| Production | `https://members.fescuegolfclub.com` (or `fescuegolfclub.com` — TBD) |

---

## Checklist

### 1. Railway — Environment Variable

In Railway → service → Variables, set:

```
NEXT_PUBLIC_APP_URL=https://staging.fescuegolfclub.com   # staging
NEXT_PUBLIC_APP_URL=https://members.fescuegolfclub.com   # production
```

This variable is used for:
- Invite links sent via email (`/admin/actions.ts`)
- Password reset redirect (`/forgot-password/actions.ts`)
- `metadataBase` for OG tags (`app/layout.tsx`)

### 2. Supabase — Auth Settings

In Supabase dashboard → Authentication → URL Configuration:

**Site URL** (one per project — use the primary URL for that environment):
```
https://staging.fescuegolfclub.com     # staging project
https://members.fescuegolfclub.com     # production project
```

**Redirect URLs** (allowlist — add all valid callback URLs):
```
https://staging.fescuegolfclub.com/auth/callback
https://staging.fescuegolfclub.com/account/reset-password
```

For production:
```
https://members.fescuegolfclub.com/auth/callback
https://members.fescuegolfclub.com/account/reset-password
```

> Without these, Supabase will reject OAuth/magic-link/password-reset redirects.

### 3. Sanity — CORS Origins

In Sanity dashboard → API → CORS Origins, add:

```
https://staging.fescuegolfclub.com     # staging
https://members.fescuegolfclub.com     # production
```

This allows the embedded Studio at `/studio` and any client-side Sanity queries to work from the custom domain.

### 4. Namecheap DNS

Add a CNAME record for each environment:

| Host | Type | Value |
|------|------|-------|
| `staging` | CNAME | Railway-provided CNAME target |
| `members` | CNAME | Railway-provided CNAME target (prod service) |

Also add the Railway TXT verification record Railway provides when you add the custom domain:

| Host | Type | Value |
|------|------|-------|
| `_railway-verify.staging` | TXT | Railway-provided value |
| `_railway-verify.members` | TXT | Railway-provided value |

### 5. Railway — Add Custom Domain

In Railway → service → Settings → Networking → `+ Custom Domain`:
- Enter the subdomain
- Select port `8080`
- Add the DNS records above, then wait for Railway to verify and provision SSL

---

## No changes needed

- **Resend** — from addresses use `mail.fescuegolfclub.com` which is already domain-verified. Emails send fine regardless of app URL.
- **Shopify** — Storefront API is public; no origin restrictions.
- **Google Maps** — API key may have HTTP referrer restrictions. If maps break on the new domain, add the new URL in Google Cloud Console → Credentials → your Maps API key → referrer restrictions.
