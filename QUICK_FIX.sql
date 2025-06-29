-- @token-meter - QUICK FIX: Create token_usage table
-- Run this in your Supabase SQL Editor immediately

CREATE TABLE IF NOT EXISTS token_usage (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month_start)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_month_start ON token_usage(month_start);

-- Enable RLS
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON token_usage TO anon, authenticated;

-- Create policies
CREATE POLICY "Users can view own token usage" ON token_usage
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own token usage" ON token_usage
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')); 