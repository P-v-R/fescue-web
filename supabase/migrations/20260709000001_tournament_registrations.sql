-- Tournament field: one row per member registered for a tournament.
-- Mirrors event_rsvps (members self-register, admins can add/remove anyone).

create table tournament_registrations (
  id            uuid        primary key default gen_random_uuid(),
  tournament_id uuid        not null references tournaments(id) on delete cascade,
  member_id     uuid        not null references members(id) on delete cascade,
  seed          int,        -- assigned during seeding (Phase 3)
  created_at    timestamptz not null default now(),
  unique (tournament_id, member_id)
);

alter table tournament_registrations enable row level security;

-- All members can see the field.
create policy "Members can read registrations"
  on tournament_registrations for select
  to authenticated
  using (true);

-- Members register themselves; admins can add anyone.
create policy "Members insert own registration"
  on tournament_registrations for insert
  to authenticated
  with check (
    member_id = auth.uid()
    or exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

-- Admins adjust seeds; the member themselves cannot mutate a registration row.
create policy "Admins update registrations"
  on tournament_registrations for update
  to authenticated
  using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

-- Members withdraw themselves; admins can remove anyone.
create policy "Members and admins delete registrations"
  on tournament_registrations for delete
  to authenticated
  using (
    member_id = auth.uid()
    or exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

-- Now that the registrations table exists, wire up the champion FK.
alter table tournaments
  add constraint tournaments_champion_registration_fk
  foreign key (champion_registration_id)
  references tournament_registrations(id) on delete set null;
