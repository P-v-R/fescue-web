-- Add phone and referral_source to membership_requests for the "Request a Tour" flow.
alter table membership_requests
  add column if not exists phone text,
  add column if not exists referral_source text;
