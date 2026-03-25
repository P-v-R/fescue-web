-- Fix infinite recursion in ALL RLS policies that reference the members table.
-- The previous fix (20260312000003) only covered members table admin policies.
-- All other tables' admin policies also query `members` with `exists(...)`, which
-- triggers members' own RLS, causing infinite recursion.
-- Solution: replace all `exists (select 1 from members ...)` checks with auth_is_admin().

-- ─────────────────────────────────────────
-- BAYS
-- ─────────────────────────────────────────
drop policy if exists "admin_all_bays" on bays;
create policy "admin_all_bays" on bays
  for all using (auth_is_admin());

-- ─────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────
drop policy if exists "admin_select_all_bookings" on bookings;
create policy "admin_select_all_bookings" on bookings
  for select using (auth_is_admin());

drop policy if exists "admin_update_all_bookings" on bookings;
create policy "admin_update_all_bookings" on bookings
  for update using (auth_is_admin());

-- ─────────────────────────────────────────
-- INVITES
-- ─────────────────────────────────────────
drop policy if exists "admin_all_invites" on invites;
create policy "admin_all_invites" on invites
  for all using (auth_is_admin());

-- ─────────────────────────────────────────
-- MEMBERSHIP REQUESTS
-- ─────────────────────────────────────────
drop policy if exists "admin_select_membership_requests" on membership_requests;
create policy "admin_select_membership_requests" on membership_requests
  for select using (auth_is_admin());

drop policy if exists "admin_update_membership_requests" on membership_requests;
create policy "admin_update_membership_requests" on membership_requests
  for update using (auth_is_admin());
