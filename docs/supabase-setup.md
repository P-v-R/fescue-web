# Supabase Setup Guide

This guide walks you through setting up two Supabase projects (staging and production) from scratch,
running the database migrations, and wiring everything into the app.

---

## 1. Create Your Supabase Account

1. Go to [supabase.com](https://supabase.com) and click **Start your project**
2. Sign up with GitHub (recommended — faster and links to your org later)
3. Create an **Organization** — name it something like `Fescue Golf Club`

---

## 2. Create Two Projects

You need **two separate Supabase projects** — one for staging, one for production.
They are completely independent databases with separate API keys.

### Staging project

1. In your org dashboard, click **New project**
2. Fill in:
   - **Name:** `fescue-staging`
   - **Database password:** generate a strong one and save it in 1Password
   - **Region:** pick the closest to your users (e.g. US West for California)
   - **Plan:** Free tier is fine for staging
3. Click **Create new project** — takes ~2 minutes to provision
4. Once ready, go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### Production project

Repeat the same steps:
1. **Name:** `fescue-production`
2. **Database password:** different strong password, save it separately
3. **Plan:** Start on Free, upgrade to **Pro ($25/mo)** before go-live — Pro includes daily automated backups
4. Copy the same three keys from **Project Settings → API**

> ⚠️ The service role key has **full database access** and bypasses all RLS. Never put it in client-side code or commit it to git.

---

## 3. Fill In Your Environment Variables

### Local development (`.env.local`)

Use your **staging** project keys for local dev:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel — Staging environment

In Vercel → your project → **Settings → Environment Variables**:
- Set **Environment** to `Preview` (or create a custom `staging` environment)
- Add all variables from your **staging** Supabase project

### Vercel — Production environment

- Set **Environment** to `Production`
- Add all variables from your **production** Supabase project

---

## 4. Run the Database Migrations

Migrations live in `supabase/migrations/`. You'll run them manually in both projects
(never auto-applied in CI — see the build guide for the rule on this).

### Option A — Supabase Dashboard SQL Editor (simplest, no CLI needed)

For each project (staging first, then production):

1. Open your project → **SQL Editor** (left sidebar)
2. Click **New query**
3. Paste the contents of `supabase/migrations/20240101000000_initial_schema.sql`
4. Click **Run** — you should see "Success. No rows returned"
5. Create another new query
6. Paste the contents of `supabase/migrations/20240101000001_rls_policies.sql`
7. Click **Run**

> Always run staging first. If something breaks, you catch it before touching production.

### Option B — Supabase CLI (recommended for ongoing development)

Install the CLI:

```bash
brew install supabase/tap/supabase
```

Link to your projects:

```bash
# Link staging
supabase link --project-ref <staging-project-ref>
# Project ref is in: Settings → General → Reference ID

# Push migrations
supabase db push
```

For production, re-link and push:

```bash
supabase link --project-ref <production-project-ref>
supabase db push
```

---

## 5. Verify the Schema

After running migrations, check everything looks right:

1. Go to **Table Editor** in the Supabase dashboard
2. You should see: `members`, `invites`, `bays`, `bookings`, `membership_requests`
3. Click `bays` — you should see 5 rows: Bay 1 through Bay 5

### Verify the exclusion constraint

Run this in SQL Editor — it should error with "conflicting key value violates exclusion constraint":

```sql
-- Insert a test booking (will fail if constraint is working)
-- First get a bay ID:
select id from bays limit 1;

-- Then try inserting two overlapping bookings with that bay_id:
insert into bookings (member_id, bay_id, start_time, duration_minutes)
values
  ('00000000-0000-0000-0000-000000000001', '<bay-id>', '2025-01-01 10:00+00', 60),
  ('00000000-0000-0000-0000-000000000001', '<bay-id>', '2025-01-01 10:30+00', 60);
-- ^ This second insert should fail with error code 23P01
```

---

## 6. Verify RLS Policies

Check RLS is enabled on all tables. In SQL Editor:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';
```

All 5 tables should show `rowsecurity = true`.

To test that a non-admin cannot read other members' data, use the Supabase **API** tab
to make a request with the anon key — it should return an empty result or only the
requesting user's own data.

---

## 7. Enable the `btree_gist` Extension

The initial schema migration enables this automatically (`create extension if not exists btree_gist`),
but if you run into an error, enable it manually:

1. Go to **Database → Extensions**
2. Search for `btree_gist`
3. Toggle it on

---

## 8. Configure Auth Settings

In your Supabase project → **Authentication → URL Configuration**:

### Staging
- **Site URL:** `https://staging.fescuegolf.com` (or your Vercel preview URL initially)
- **Redirect URLs:** add `http://localhost:3000/**` for local dev

### Production
- **Site URL:** `https://fescuegolf.com`
- **Redirect URLs:** `https://fescuegolf.com/**`

### Email templates (optional but recommended)

Go to **Authentication → Email Templates** to customize the password reset email with
Fescue branding. The invite flow uses a custom token (not Supabase's magic link), so
the invite email is sent via Resend and doesn't use these templates.

---

## 9. Create Your First Admin User

The admin panel at `/admin` requires `is_admin = true` in the members table.
After you register your first account (via an invite token flow once that's built,
or directly via Supabase for initial setup), set yourself as admin:

```sql
update members
set is_admin = true
where email = 'your@email.com';
```

Run this in SQL Editor on **both** staging and production after creating your account.

---

## 10. Backup Policy (Production)

- Supabase Pro includes **daily automated backups** with 7-day retention
- Before any migration: **manually trigger a backup** → Database → Backups → "Create backup"
- Never run `delete` or `drop` without a `where` clause in production
- Always run migrations on **staging first**, verify, then run on production
- Add a rollback comment at the top of every migration file (already done in the migration files)

---

## Quick Reference — Project Settings Locations

| Setting | Location in Dashboard |
|---|---|
| API URL + Keys | Settings → API |
| Project Reference ID | Settings → General |
| Database password | Settings → Database |
| Auth redirect URLs | Authentication → URL Configuration |
| Email templates | Authentication → Email Templates |
| Extensions | Database → Extensions |
| SQL Editor | Left sidebar → SQL Editor |
| Table Editor | Left sidebar → Table Editor |
| Backups | Database → Backups |

---

## Troubleshooting

**"permission denied for table members"**
- RLS is blocking the query. Make sure your session has a valid JWT and the policy covers the operation.
- For admin operations, confirm `SUPABASE_SERVICE_ROLE_KEY` is set correctly server-side.

**"could not create exclusion constraint" during migration**
- The `btree_gist` extension isn't enabled. Enable it via Database → Extensions, then re-run the migration.

**Auth user created but member row missing**
- The `acceptInvite` function rolls back the auth user on member insert failure.
- Check the server logs for the specific error — usually a RLS policy issue on members INSERT.
- The service role client should bypass RLS, so if this happens check that `SUPABASE_SERVICE_ROLE_KEY` is the correct key (not the anon key).

**"Invalid API key"**
- Double-check you haven't swapped staging and production keys.
- The anon key starts with `eyJ` and is safe to expose. The service role key also starts with `eyJ` but must stay server-side only.
