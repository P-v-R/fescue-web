-- Add a global "phase" to matches: the concurrent play slot a match belongs to
-- across both brackets, so a whole round can be scheduled as one SGT event.
-- Winners round r is phase r; losers round r trails its feeding winners round by
-- one, so phase r+1; the grand final runs one phase after the losers final.

alter table tournament_matches add column if not exists phase int not null default 1;

update tournament_matches set phase = round where bracket = 'winners';
update tournament_matches set phase = round + 1 where bracket = 'losers';

-- Grand final: one phase past the losers final (= max losers round + 2). With no
-- losers bracket (2-player double elim) it follows the single winners round.
update tournament_matches m set phase = (
  select coalesce(
    (select max(l.round) + 2 from tournament_matches l
      where l.tournament_id = m.tournament_id and l.bracket = 'losers'),
    (select max(w.round) + 1 from tournament_matches w
      where w.tournament_id = m.tournament_id and w.bracket = 'winners')
  )
) where m.bracket = 'grand_final';

create index if not exists tournament_matches_phase_idx on tournament_matches(tournament_id, phase);
