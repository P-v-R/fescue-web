-- Replace single guest_name/guest_email columns with a guests JSONB array.
-- Supports up to 3 guests per booking (foursome = 1 member + 3 guests).

alter table bookings add column guests jsonb not null default '[]'::jsonb;

-- Migrate existing single-guest data into the new array
update bookings
set guests = jsonb_build_array(
  jsonb_build_object('name', guest_name, 'email', guest_email)
)
where guest_name is not null and guest_email is not null;

alter table bookings drop column guest_name;
alter table bookings drop column guest_email;
