-- Create events table for in-app social event management (replaces Sanity socialEvent)

create table events (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  description  text,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  location     text,
  image_url    text,
  rsvp_enabled boolean     not null default true,
  created_by   uuid        references members(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table events enable row level security;

create policy "Members can read events"
  on events for select
  to authenticated
  using (true);

create policy "Admins can insert events"
  on events for insert
  to authenticated
  with check (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update events"
  on events for update
  to authenticated
  using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete events"
  on events for delete
  to authenticated
  using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );
