-- ROLLBACK:
--   drop table if exists membership_requests, bookings, bays, invites, members cascade;
--   drop extension if exists btree_gist;

-- Required for GiST exclusion constraint (overlap prevention)
create extension if not exists btree_gist;

-- ─────────────────────────────────────────
-- MEMBERS
-- id mirrors auth.users so RLS can use auth.uid() = id directly
-- ─────────────────────────────────────────
create table members (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text not null,
  avatar_url  text,
  is_active   boolean default true,
  is_admin    boolean default false,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- INVITES
-- ─────────────────────────────────────────
create table invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  token       uuid unique default gen_random_uuid(),
  invited_by  uuid references members(id),
  sent_at     timestamptz default now(),
  accepted_at timestamptz,
  expires_at  timestamptz default (now() + interval '30 days')
);

-- ─────────────────────────────────────────
-- BAYS
-- ─────────────────────────────────────────
create table bays (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  is_active boolean default true
);

-- Seed data
insert into bays (name) values
  ('Bay 1'),
  ('Bay 2'),
  ('Bay 3'),
  ('Bay 4'),
  ('Bay 5');

-- ─────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────
create table bookings (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid references members(id) on delete restrict,
  bay_id           uuid references bays(id) on delete restrict,
  start_time       timestamptz not null,
  duration_minutes integer not null check (duration_minutes in (60, 90, 120)),
  end_time         timestamptz not null,
  guest_name       text,
  guest_email      text,
  cancelled_at     timestamptz,
  created_at       timestamptz default now(),

  -- Prevent double-booking: same bay, overlapping range, not cancelled
  -- '[)' = inclusive start, exclusive end (half-open interval)
  exclude using gist (
    bay_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  ) where (cancelled_at is null)
);

-- ─────────────────────────────────────────
-- MEMBERSHIP REQUESTS
-- ─────────────────────────────────────────
create table membership_requests (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  email      text not null,
  message    text,
  status     text default 'pending'
               check (status in ('pending', 'invited', 'declined')),
  created_at timestamptz default now()
);
