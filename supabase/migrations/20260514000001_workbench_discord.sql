-- Rework workbench_pledges to use Discord identity instead of Fescue member_id.
-- The workbench fund is now driven by the Discord bot, not the web app.

drop table if exists workbench_pledges;

create table workbench_pledges (
  id uuid primary key default gen_random_uuid(),
  discord_user_id text not null,
  discord_username text not null,
  amount integer not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

alter table workbench_pledges enable row level security;

-- Authenticated web users can still read pledges (e.g. for the /workbench page)
create policy "Anyone authenticated can view pledges"
  on workbench_pledges for select
  to authenticated
  using (true);

-- All writes go through the Discord bot via service role — no RLS insert policy needed.

-- One pledge per Discord user
create unique index one_pledge_per_discord_user on workbench_pledges(discord_user_id);
