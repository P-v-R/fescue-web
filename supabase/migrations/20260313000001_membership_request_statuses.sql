-- Expand membership_requests.status to include 'contacted' and 'onboarded'.
-- The original CHECK constraint was created inline in the CREATE TABLE statement
-- and Postgres auto-named it membership_requests_status_check.

alter table membership_requests
  drop constraint if exists membership_requests_status_check;

alter table membership_requests
  add constraint membership_requests_status_check
  check (status in ('pending', 'contacted', 'invited', 'declined', 'onboarded'));
