-- User Generations Table
-- Add this to your existing Supabase database to enable account-level persistence

-- User Generations table (for storing AI-generated content)
CREATE TABLE IF NOT EXISTS user_generations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model TEXT NOT NULL, -- 'imagen4' or 'kling'
  prompt TEXT NOT NULL,
  settings JSONB DEFAULT '{}', -- duration, aspect_ratio, etc.
  result_data JSONB NOT NULL, -- stores the full generation result
  result_url TEXT, -- main image/video URL for quick access
  cost DECIMAL(10,4) DEFAULT 0,
  latency INTEGER DEFAULT 0,
  request_id TEXT, -- fal.ai request ID
  status TEXT CHECK (status IN ('success', 'error', 'pending')) DEFAULT 'success',
  error_message TEXT,
  is_pinned BOOLEAN DEFAULT false, -- allow users to pin favorites
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_generations_user_id ON user_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_generations_created_at ON user_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_generations_model ON user_generations(model);
CREATE INDEX IF NOT EXISTS idx_user_generations_status ON user_generations(status);
CREATE INDEX IF NOT EXISTS idx_user_generations_pinned ON user_generations(is_pinned);

-- Add updated_at trigger
CREATE TRIGGER update_user_generations_updated_at BEFORE UPDATE ON user_generations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE user_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_generations
CREATE POLICY "Users can view own generations" ON user_generations
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can create own generations" ON user_generations
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own generations" ON user_generations
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own generations" ON user_generations
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Grant permissions
GRANT ALL ON user_generations TO anon, authenticated;

-- @clydra-core Migration to add chat_tokens column to usage_meter if it doesn't exist
-- This is safe to run multiple times

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usage_meter' 
        AND column_name = 'chat_tokens'
    ) THEN
        ALTER TABLE usage_meter ADD COLUMN chat_tokens BIGINT DEFAULT 0;
    END IF;
END $$; 