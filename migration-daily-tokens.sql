-- Migration to add daily tokens table
-- @grant-80k - Daily tokens table for persistent daily token tracking
CREATE TABLE daily_tokens (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tokens_granted INTEGER NOT NULL DEFAULT 80000,
  tokens_remaining INTEGER NOT NULL DEFAULT 80000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_id, date)
);

-- @grant-80k - Create indexes for performance
CREATE INDEX idx_daily_tokens_user_date ON daily_tokens(user_id, date);
CREATE INDEX idx_daily_tokens_date ON daily_tokens(date);

-- @grant-80k - Enable RLS for daily_tokens
ALTER TABLE daily_tokens ENABLE ROW LEVEL SECURITY;

-- @grant-80k - Daily tokens policies
DROP POLICY IF EXISTS "Users can view own daily tokens" ON daily_tokens;
CREATE POLICY "Users can view own daily tokens" ON daily_tokens
  FOR SELECT USING (user_id IN (SELECT id FROM auth.users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can manage own daily tokens" ON daily_tokens;
CREATE POLICY "Users can manage own daily tokens" ON daily_tokens
  FOR ALL USING (user_id IN (SELECT id FROM auth.users WHERE clerk_id = (auth.jwt() ->> 'sub')));

-- @grant-80k - Grant permissions for daily_tokens table
GRANT ALL ON daily_tokens TO anon, authenticated; 