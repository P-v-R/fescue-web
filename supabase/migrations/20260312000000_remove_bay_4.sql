-- Remove Bay 4 — club only has Bay 1, Bay 2, Bay 3, and Big Bay.
-- Soft-delete by deactivating so existing bookings are preserved.
update bays set is_active = false where name = 'Bay 4';
