-- SGT linkage for scoring. Each Fescue tournament maps to one SGT tour; each
-- bracket round maps to one SGT event (head-to-head) under that tour. Matches in
-- the same round share the event id and its create settings (persisted so the
-- event can be renamed/regenerated, since SGT's edit endpoint resends all fields).

alter table tournaments add column if not exists sgt_tour_id int;

alter table tournament_matches add column if not exists sgt_settings jsonb;
