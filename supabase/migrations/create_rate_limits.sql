-- Rate Limiting Table for Push Notifications
-- Stores per-user HIGH priority push counts and 24h window tracking

CREATE TABLE IF NOT EXISTS rate_limits (
    user_hash TEXT PRIMARY KEY,
    high_push_count_24h INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient window expiry queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window 
ON rate_limits(window_start);

-- Index for monitoring/cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_updated 
ON rate_limits(updated_at);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rate_limits_updated_at
    BEFORE UPDATE ON rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_rate_limits_updated_at();

-- Optional: Auto-cleanup old records (older than 48h)
-- Run this periodically via cron or Supabase Edge Function
-- DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '48 hours';

COMMENT ON TABLE rate_limits IS 'Tracks HIGH priority push notification rate limiting per user (max 2 per 24h)';
COMMENT ON COLUMN rate_limits.user_hash IS 'Unique user identifier (hashed user ID)';
COMMENT ON COLUMN rate_limits.high_push_count_24h IS 'Number of HIGH priority pushes sent in current 24h window';
COMMENT ON COLUMN rate_limits.window_start IS 'Start time of current 24h rate limit window';
COMMENT ON COLUMN rate_limits.updated_at IS 'Last update timestamp (auto-updated)';
