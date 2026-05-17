-- Workbench Fund: pledge tracking

create table workbench_pledges (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

alter table workbench_pledges enable row level security;

-- Members can read all pledges (for the leaderboard)
create policy "Anyone authenticated can view pledges"
  on workbench_pledges for select
  to authenticated
  using (true);

-- Members can only insert their own pledge
create policy "Members can insert own pledge"
  on workbench_pledges for insert
  to authenticated
  with check (member_id = auth.uid());

-- One pledge per member
create unique index one_pledge_per_member on workbench_pledges(member_id);

-- Config table (goal, optional pinned Discord message ID for future use)
create table workbench_config (
  id integer primary key default 1,
  goal integer not null default 2500,
  discord_pinned_message_id text,
  updated_at timestamptz default now()
);

insert into workbench_config (id, goal) values (1, 2500);
