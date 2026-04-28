alter table membership_requests
  add column contacted_by  uuid references members(id),
  add column contacted_at  timestamptz;
