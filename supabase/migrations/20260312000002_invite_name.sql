-- Add invitee first name to invites for personalised emails.
alter table invites add column if not exists name text;
