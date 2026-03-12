-- ROLLBACK:
--   alter table members disable row level security;
--   alter table bays disable row level security;
--   alter table bookings disable row level security;
--   alter table invites disable row level security;
--   alter table membership_requests disable row level security;
--   (then drop each policy by name)

-- ─────────────────────────────────────────
-- MEMBERS
-- ─────────────────────────────────────────
alter table members enable row level security;

-- Members can read and update their own record
create policy "members_select_own" on members
  for select using (auth.uid() = id);

create policy "members_update_own" on members
  for update using (auth.uid() = id);

-- Admins can read all members
create policy "admin_select_all_members" on members
  for select using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

-- Admins can update all members (e.g. deactivate)
create policy "admin_update_all_members" on members
  for update using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

-- Service role key bypasses RLS — used for insert on invite acceptance

-- ─────────────────────────────────────────
-- BAYS
-- ─────────────────────────────────────────
alter table bays enable row level security;

-- Any authenticated member can read bays
create policy "bays_select_authenticated" on bays
  for select using (auth.uid() is not null);

-- Only admins can write bays
create policy "admin_all_bays" on bays
  for all using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

-- ─────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────
alter table bookings enable row level security;

-- Members can view their own bookings
create policy "member_select_own_bookings" on bookings
  for select using (auth.uid() = member_id);

-- Members can insert their own bookings only
create policy "member_insert_own_bookings" on bookings
  for insert with check (auth.uid() = member_id);

-- Members can cancel (update) their own bookings
create policy "member_update_own_bookings" on bookings
  for update using (auth.uid() = member_id);

-- Admins can read all bookings
create policy "admin_select_all_bookings" on bookings
  for select using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

-- Admins can cancel any booking
create policy "admin_update_all_bookings" on bookings
  for update using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

-- All authenticated members can read bays for the availability grid
-- (they need to see other members' bookings to know what's taken)
create policy "member_select_all_bookings_for_grid" on bookings
  for select using (auth.uid() is not null);

-- ─────────────────────────────────────────
-- INVITES
-- ─────────────────────────────────────────
alter table invites enable row level security;

-- Admins only for all operations
create policy "admin_all_invites" on invites
  for all using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

-- Service role key used for token lookup during invite acceptance (bypasses RLS)

-- ─────────────────────────────────────────
-- MEMBERSHIP REQUESTS
-- ─────────────────────────────────────────
alter table membership_requests enable row level security;

-- Anyone (unauthenticated) can submit a request
create policy "public_insert_membership_requests" on membership_requests
  for insert with check (true);

-- Only admins can read requests
create policy "admin_select_membership_requests" on membership_requests
  for select using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

-- Only admins can update status
create policy "admin_update_membership_requests" on membership_requests
  for update using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );
