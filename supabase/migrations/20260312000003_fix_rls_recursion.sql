-- Fix infinite recursion in admin RLS policies on members table.
-- The previous policies used `exists (select 1 from members ...)` inside a
-- policy ON members, which caused Postgres to recurse indefinitely.
-- Solution: a security definer function bypasses RLS when checking admin status.

create or replace function auth_is_admin()
returns boolean language sql security definer stable as $$
  select coalesce((select is_admin from members where id = auth.uid()), false)
$$;

drop policy if exists "admin_select_all_members" on members;
create policy "admin_select_all_members" on members
  for select using (auth_is_admin());

drop policy if exists "admin_update_all_members" on members;
create policy "admin_update_all_members" on members
  for update using (auth_is_admin());
