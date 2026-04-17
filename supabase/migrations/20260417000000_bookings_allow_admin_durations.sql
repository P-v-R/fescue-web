-- Allow any multiple of 30 minutes up to 840 (14 hours, full operating day)
-- to support admin bookings for longer time blocks.
alter table bookings
  drop constraint bookings_duration_minutes_check;

alter table bookings
  add constraint bookings_duration_minutes_check
  check (duration_minutes > 0 and duration_minutes % 30 = 0 and duration_minutes <= 840);
