# SUPABASE MIGRATION INSTRUCTIONS

## Manual Migration Steps

Since automated migration failed (import.meta.env not available in Node.js context), please run the SQL manually:

### Step 1: Open Supabase Dashboard
1. Open: https://wbajyysqvkkdqsugupyj.supabase.co
2. Go to **SQL Editor**

### Step 2: Run Migration SQL

Copy and paste this SQL:

```sql
-- Rate Limiting Table for Push Notifications
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
```

### Step 3: Verify Table

Run this query to verify:

```sql
SELECT * FROM rate_limits LIMIT 1;
```

Should return no rows (empty table) but no errors.

### Step 4: Test From Application

Once table is created, run:
```bash
npx tsx scripts/tests/qa-rate-limit.test.ts
```

---

## Alternative: Quick Test Without Migration

If you want to test immediately without creating the table, we can:
1. Use the in-memory version temporarily
2. Create table later for production

Let me know which approach you prefer!
