-- Add new fields to membership_requests for the updated intake form.
alter table membership_requests
  add column if not exists zip_code text,
  add column if not exists profession text,
  add column if not exists has_membership_org boolean,
  add column if not exists membership_org_names text;
