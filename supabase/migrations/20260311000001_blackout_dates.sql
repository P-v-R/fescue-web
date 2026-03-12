create table blackout_dates (
  id          uuid        primary key default gen_random_uuid(),
  date        date        not null unique,
  reason      text,
  created_by  uuid        references members(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table blackout_dates enable row level security;

-- All authenticated members can read blackout dates (so reservations page can warn them)
create policy "Members can read blackout dates"
  on blackout_dates for select
  to authenticated
  using (true);

-- Writes go through the service-role admin client — no insert/update/delete RLS needed
