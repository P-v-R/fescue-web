-- Replace coarse blackout_dates with granular blackout_periods
drop table if exists blackout_dates;

create table blackout_periods (
  id          uuid        primary key default gen_random_uuid(),
  date        date        not null,
  start_time  time,                         -- null = all day
  end_time    time,                         -- null = all day
  all_bays    boolean     not null default false,
  bay_ids     uuid[]      not null default '{}',  -- ignored when all_bays = true
  reason      text,
  created_by  uuid        references members(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table blackout_periods enable row level security;

create policy "Members can read blackout periods"
  on blackout_periods for select
  to authenticated
  using (true);
