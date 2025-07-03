-- Migration to create daily_tokens table for persistent token tracking
-- Run this in your Supabase SQL editor or via psql

-- @grant-40k - Daily tokens table for persistent daily token tracking
CREATE TABLE IF NOT EXISTS daily_tokens (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tokens_granted INTEGER NOT NULL DEFAULT 40000,
  tokens_remaining INTEGER NOT NULL DEFAULT 40000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

-- @grant-40k - Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_tokens_user_id ON daily_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tokens_date ON daily_tokens(date);

-- @grant-40k - Enable RLS for daily_tokens
ALTER TABLE daily_tokens ENABLE ROW LEVEL SECURITY;

-- @grant-40k - Daily tokens policies
DROP POLICY IF EXISTS "Users can view own daily tokens" ON daily_tokens;
CREATE POLICY "Users can view own daily tokens" ON daily_tokens
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can manage own daily tokens" ON daily_tokens;
CREATE POLICY "Users can manage own daily tokens" ON daily_tokens
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

-- @grant-40k - Grant permissions for daily_tokens table
GRANT ALL ON daily_tokens TO anon, authenticated; 