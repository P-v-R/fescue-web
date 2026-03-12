-- Add optional contact fields to members
alter table members
  add column if not exists phone   text,
  add column if not exists discord text;

-- Allow any active member to read other active members for the directory.
-- Columns are open to authenticated members — queries select only what's needed.
create policy "members_select_active_directory" on members
  for select using (
    auth.uid() is not null
    and is_active = true
  );
