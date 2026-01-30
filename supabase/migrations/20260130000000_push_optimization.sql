-- Create enum for source state
CREATE TYPE push_source_state_enum AS ENUM (
    'active', 
    'soft_suppressed', 
    'hard_suppressed', 
    'force_active', 
    'force_disabled'
);

-- Table: push_source_state
CREATE TABLE IF NOT EXISTS push_source_state (
    source_id TEXT PRIMARY KEY,
    scope TEXT NOT NULL,
    priority TEXT NOT NULL,
    state push_source_state_enum NOT NULL DEFAULT 'active',
    last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT,
    consecutive_low_periods INT NOT NULL DEFAULT 0,
    metrics_snapshot JSONB,
    manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: push_audit_log
CREATE TABLE IF NOT EXISTS push_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_id TEXT NOT NULL,
    previous_state push_source_state_enum NOT NULL,
    new_state push_source_state_enum NOT NULL,
    rule_triggered TEXT,
    metrics_snapshot JSONB,
    reason TEXT,
    user_id UUID -- Optional, for manual actions
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_source_state_state ON push_source_state(state);
CREATE INDEX IF NOT EXISTS idx_push_audit_log_source_id ON push_audit_log(source_id);
CREATE INDEX IF NOT EXISTS idx_push_audit_log_timestamp ON push_audit_log(timestamp);
