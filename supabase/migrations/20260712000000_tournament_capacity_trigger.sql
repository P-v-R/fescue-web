-- Enforce tournament capacity at the database level to close the read-before-write
-- race in the registration action (two members can both pass an app-level count
-- check and both insert). Locking the parent tournament row serialises concurrent
-- registration inserts for the same tournament.

create or replace function enforce_tournament_capacity()
returns trigger
language plpgsql
as $$
declare
  cap int;
  current_count int;
begin
  -- FOR UPDATE serialises concurrent inserts against the same tournament.
  select capacity into cap from tournaments where id = new.tournament_id for update;

  if cap is not null then
    select count(*) into current_count
    from tournament_registrations
    where tournament_id = new.tournament_id;

    if current_count >= cap then
      raise exception 'Tournament is full'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger tournament_capacity_check
  before insert on tournament_registrations
  for each row
  execute function enforce_tournament_capacity();
