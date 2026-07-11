-- Bracket matches for match play tournaments. Supports single and double
-- elimination. Advancement pointers carry an explicit slot (1 or 2) so the
-- resolver knows which side of the downstream match a winner/loser fills.

create table tournament_matches (
  id                       uuid        primary key default gen_random_uuid(),
  tournament_id            uuid        not null references tournaments(id) on delete cascade,
  bracket                  text        not null default 'winners'
                             check (bracket in ('winners', 'losers', 'grand_final')),
  round                    int         not null,          -- 1-based within its bracket
  position                 int         not null,          -- 0-based slot within the round
  player1_registration_id  uuid        references tournament_registrations(id) on delete set null,
  player2_registration_id  uuid        references tournament_registrations(id) on delete set null,
  winner_registration_id   uuid        references tournament_registrations(id) on delete set null,
  is_bye                   boolean     not null default false,
  result_type              text        check (result_type in ('play', 'forfeit', 'bye', 'admin')),
  result_summary           text,       -- human-readable outcome, e.g. "3 & 2"
  sgt_tournament_id        int,        -- the SGT event this match is played in (Phase 4)
  status                   text        not null default 'pending'
                             check (status in ('pending', 'scheduled', 'completed')),
  next_match_id            uuid        references tournament_matches(id) on delete set null,  -- winner advances here
  next_match_slot          int         check (next_match_slot in (1, 2)),
  loser_match_id           uuid        references tournament_matches(id) on delete set null,  -- double-elim loser drops here
  loser_match_slot         int         check (loser_match_slot in (1, 2)),
  created_at               timestamptz not null default now(),
  unique (tournament_id, bracket, round, position)
);

alter table tournament_matches enable row level security;

create policy "Members can read matches"
  on tournament_matches for select
  to authenticated
  using (true);

create policy "Admins can insert matches"
  on tournament_matches for insert
  to authenticated
  with check (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update matches"
  on tournament_matches for update
  to authenticated
  using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete matches"
  on tournament_matches for delete
  to authenticated
  using (
    exists (select 1 from members where id = auth.uid() and is_admin = true)
  );

create index tournament_matches_tournament_idx on tournament_matches(tournament_id);
