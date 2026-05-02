-- Add pipeline status and tour_date to membership_requests
alter table membership_requests
  add column tour_date timestamptz;

alter table membership_requests
  drop constraint if exists membership_requests_status_check;

alter table membership_requests
  add constraint membership_requests_status_check
  check (status in ('pending', 'contacted', 'pipeline', 'invited', 'declined', 'onboarded'));
