-- Batch seed assignment in a single statement, replacing the per-row UPDATE loop
-- in setRegistrationSeeds. Called with the service-role (admin) client.

create or replace function set_registration_seeds(seed_pairs jsonb)
returns void
language sql
as $$
  update tournament_registrations tr
  set seed = p.seed
  from jsonb_to_recordset(seed_pairs) as p(id uuid, seed int)
  where tr.id = p.id;
$$;
