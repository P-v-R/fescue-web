-- Add member_since (year) to members table.
-- Nullable integer — null means "use created_at year" as fallback.
-- Admins can set this retroactively to reflect when someone actually joined the club.

alter table members add column member_since integer default null;
