-- Create event_rsvps table for native RSVP tracking

create table event_rsvps (
  id         uuid        primary key default gen_random_uuid(),
  event_id   uuid        not null references events(id) on delete cascade,
  member_id  uuid        not null references members(id) on delete cascade,
  status     text        not null check (status in ('going', 'not_going')),
  created_at timestamptz not null default now(),
  unique (event_id, member_id)
);

alter table event_rsvps enable row level security;

-- All members can see all RSVPs (to show attendee lists)
create policy "Members can read all RSVPs"
  on event_rsvps for select
  to authenticated
  using (true);

create policy "Members can insert own RSVP"
  on event_rsvps for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "Members can update own RSVP"
  on event_rsvps for update
  to authenticated
  using (member_id = auth.uid());

-- Members can remove own; admins can remove any
create policy "Members and admins can delete RSVPs"
  on event_rsvps for delete
  to authenticated
  using (
    member_id = auth.uid()
    or exists (select 1 from members where id = auth.uid() and is_admin = true)
  );
