-- Security fixes:
-- 1. auth_is_admin() now also requires is_active
-- 2. Fix events + event_rsvps RLS to use auth_is_admin() (avoids recursion)
-- 3. Member-facing policies enforce is_active so deactivated members
--    with a live JWT can't query data directly via the REST API

-- ── 1. Patch auth_is_admin to require is_active ───────────────────────────────

create or replace function auth_is_admin()
returns boolean language sql security definer stable as $$
  select coalesce(
    (select is_admin from members where id = auth.uid() and is_active = true),
    false
  )
$$;

-- ── 2. Fix events RLS (drop old recursive patterns, use auth_is_admin()) ──────

drop policy if exists "events_select_authenticated" on events;
drop policy if exists "events_insert_admin" on events;
drop policy if exists "events_update_admin" on events;
drop policy if exists "events_delete_admin" on events;

create policy "events_select_authenticated" on events
  for select using (
    exists (select 1 from members where id = auth.uid() and is_active = true)
  );

create policy "events_insert_admin" on events
  for insert with check (auth_is_admin());

create policy "events_update_admin" on events
  for update using (auth_is_admin());

create policy "events_delete_admin" on events
  for delete using (auth_is_admin());

-- ── 3. Fix event_rsvps RLS ────────────────────────────────────────────────────

drop policy if exists "rsvps_select_authenticated" on event_rsvps;
drop policy if exists "rsvps_insert_own" on event_rsvps;
drop policy if exists "rsvps_update_own" on event_rsvps;
drop policy if exists "rsvps_delete_own_or_admin" on event_rsvps;

create policy "rsvps_select_authenticated" on event_rsvps
  for select using (
    exists (select 1 from members where id = auth.uid() and is_active = true)
  );

create policy "rsvps_insert_own" on event_rsvps
  for insert with check (
    member_id = auth.uid()
    and exists (select 1 from members where id = auth.uid() and is_active = true)
  );

create policy "rsvps_update_own" on event_rsvps
  for update using (
    member_id = auth.uid()
    and exists (select 1 from members where id = auth.uid() and is_active = true)
  );

create policy "rsvps_delete_own_or_admin" on event_rsvps
  for delete using (
    member_id = auth.uid()
    or auth_is_admin()
  );

-- ── 4. Patch member-facing policies to enforce is_active ─────────────────────

-- bays
drop policy if exists "bays_select_authenticated" on bays;
create policy "bays_select_authenticated" on bays
  for select using (
    exists (select 1 from members where id = auth.uid() and is_active = true)
  );

-- bookings (select for grid)
drop policy if exists "member_select_all_bookings_for_grid" on bookings;
create policy "member_select_all_bookings_for_grid" on bookings
  for select using (
    exists (select 1 from members where id = auth.uid() and is_active = true)
  );
