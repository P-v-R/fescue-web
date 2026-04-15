-- Allow 30-minute bookings (constraint previously only allowed 60, 90, 120)
alter table bookings
  drop constraint bookings_duration_minutes_check;

alter table bookings
  add constraint bookings_duration_minutes_check
  check (duration_minutes in (30, 60, 90, 120));
