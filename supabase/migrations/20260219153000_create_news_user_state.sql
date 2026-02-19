-- Create ENUM for state
CREATE TYPE user_news_status AS ENUM ('ARCHIVED', 'DELETED');
-- Create table
CREATE TABLE news_user_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    news_id BIGINT NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    status user_news_status NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, news_id)
);
-- Index for fast lookup by user and status
CREATE INDEX idx_news_user_state_lookup ON news_user_state(user_id, status);
-- Enable RLS
ALTER TABLE news_user_state ENABLE ROW LEVEL SECURITY;
-- RLS Policies
-- 1. Users can view their own state
CREATE POLICY "Users can view own news state" ON news_user_state FOR
SELECT USING (auth.uid() = user_id);
-- 2. Users can manage (insert/update/delete) their own state
CREATE POLICY "Users can manage own news state" ON news_user_state FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);