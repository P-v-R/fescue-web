-- Join requests: self-registration from members who received the /join link.
-- Password is AES-256-GCM encrypted (server-side key) and wiped on review.

CREATE TABLE join_requests (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name          TEXT        NOT NULL,
  email              TEXT        NOT NULL,
  phone              TEXT,
  discord            TEXT,
  encrypted_password TEXT,       -- AES-256-GCM; set to NULL once reviewed
  status             TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'approved', 'declined')),
  reviewed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate pending requests for the same email (case-insensitive)
CREATE UNIQUE INDEX join_requests_pending_email_idx
  ON join_requests (lower(email))
  WHERE status = 'pending';

ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- No public RLS policies — all access via service role (admin client).
-- Public inserts are performed through server actions using the admin client.
