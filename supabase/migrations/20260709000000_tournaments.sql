-- Match play tournaments: admin-created, member-registered, bracket-based.
-- Scoring is handled later via the SGT club-admin API; this migration only covers
-- the tournament record + its lifecycle status.

create table tournaments (
  id                       uuid        primary key default gen_random_uuid(),
  name                     text        not null,
  description              text,
  format                   text        not null check (format in ('single_elim', 'double_elim')),
  status                   text        not null default 'draft'
                             check (status in ('draft', 'registration', 'seeding', 'in_progress', 'completed', 'cancelled')),
  capacity                 int         check (capacity is null or capacity > 1),  -- null = unlimited
  registration_closes_at   timestamptz,
  starts_at                timestamptz,
  champion_registration_id uuid,       -- set on completion; FK added with tournament_registrations
  created_by               uuid        references members(id) on delete set null,
  created_at               timestamptz not null default now()
);

alter table tournaments enable row level security;

-- Mirrors the events table policies: members read all, admins write.
create policy "Members can read tournaments"
  on tournaments for select
  to authenticated
  using (true);

create policy "Admins can insert tournaments"
  on tournaments for insert
  to authenticated
  with check (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update tournaments"
  on tournaments for update
  to authenticated
  using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete tournaments"
  on tournaments for delete
  to authenticated
  using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );
