-- Add optional SGT (Simulator Golf Tour) username to members.
-- Used to cross-reference tournament/leaderboard data with club members.
ALTER TABLE members ADD COLUMN IF NOT EXISTS sgt_username text;

-- Also store it on membership requests so admin can see it before approving.
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS sgt_username text;
