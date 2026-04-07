-- Allow existing members to self-report their membership year when submitting a join request
alter table join_requests
  add column if not exists member_since integer default null;
