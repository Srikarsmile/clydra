-- Clydra Labs Database Setup
-- Run this script in your Supabase SQL editor to set up the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys table (for API key management)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  last_used TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Requests table (for logging API usage)
CREATE TABLE IF NOT EXISTS api_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response_data JSONB,
  cost DECIMAL(10,4) DEFAULT 0,
  latency INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('success', 'error', 'pending')) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (for dashboard projects - replaces experiments)
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service TEXT NOT NULL,
  prompt TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  cost DECIMAL(10,4) DEFAULT 0,
  latency INTEGER DEFAULT 0,
  result_url TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_api_requests_user_id ON api_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON api_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (clerk_id = (auth.jwt() ->> 'sub'));

-- Projects policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can create own projects" ON projects;
CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

-- API requests policies
DROP POLICY IF EXISTS "Users can view own api requests" ON api_requests;
CREATE POLICY "Users can view own api requests" ON api_requests
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can create own api requests" ON api_requests;
CREATE POLICY "Users can create own api requests" ON api_requests
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

-- API keys policies
DROP POLICY IF EXISTS "Users can view own api keys" ON api_keys;
CREATE POLICY "Users can view own api keys" ON api_keys
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can create own api keys" ON api_keys;
CREATE POLICY "Users can create own api keys" ON api_keys
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can update own api keys" ON api_keys;
CREATE POLICY "Users can update own api keys" ON api_keys
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can delete own api keys" ON api_keys;
CREATE POLICY "Users can delete own api keys" ON api_keys
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

-- Create a function to automatically create user record when first accessed
CREATE OR REPLACE FUNCTION create_user_if_not_exists(clerk_user_id TEXT, user_email TEXT, user_first_name TEXT, user_last_name TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Try to find existing user
  SELECT id INTO user_id FROM users WHERE clerk_id = clerk_user_id;
  
  -- If user doesn't exist, create them
  IF user_id IS NULL THEN
    INSERT INTO users (clerk_id, email, first_name, last_name)
    VALUES (clerk_user_id, user_email, user_first_name, user_last_name)
    RETURNING id INTO user_id;
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Usage meter table for chat token tracking
CREATE TABLE IF NOT EXISTS usage_meter (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_tokens BIGINT DEFAULT 0,
  gpt4o_tokens BIGINT DEFAULT 0,
  claude_tokens BIGINT DEFAULT 0,
  gemini_tokens BIGINT DEFAULT 0,
  reset_date TIMESTAMP WITH TIME ZONE DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for usage_meter
CREATE INDEX IF NOT EXISTS idx_usage_meter_user_id ON usage_meter(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_meter_reset_date ON usage_meter(reset_date);

-- Enable RLS for usage_meter
ALTER TABLE usage_meter ENABLE ROW LEVEL SECURITY;

-- Usage meter policies
DROP POLICY IF EXISTS "Users can view own usage" ON usage_meter;
CREATE POLICY "Users can view own usage" ON usage_meter
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can update own usage" ON usage_meter;
CREATE POLICY "Users can update own usage" ON usage_meter
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

-- Add trigger for usage_meter updated_at
DROP TRIGGER IF EXISTS update_usage_meter_updated_at ON usage_meter;
CREATE TRIGGER update_usage_meter_updated_at BEFORE UPDATE ON usage_meter
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset monthly usage
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE usage_meter 
  SET 
    chat_tokens = 0,
    gpt4o_tokens = 0,
    claude_tokens = 0,
    gemini_tokens = 0,
    reset_date = DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
    updated_at = NOW()
  WHERE reset_date <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Chat History table for storing user conversations
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for chat_history
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_last_message_at ON chat_history(last_message_at DESC);

-- Enable RLS for chat_history
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Chat history policies
DROP POLICY IF EXISTS "Users can view own chat history" ON chat_history;
CREATE POLICY "Users can view own chat history" ON chat_history
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can create own chat history" ON chat_history;
CREATE POLICY "Users can create own chat history" ON chat_history
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can update own chat history" ON chat_history;
CREATE POLICY "Users can update own chat history" ON chat_history
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can delete own chat history" ON chat_history;
CREATE POLICY "Users can delete own chat history" ON chat_history
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

-- Add trigger for chat_history updated_at
DROP TRIGGER IF EXISTS update_chat_history_updated_at ON chat_history;
CREATE TRIGGER update_chat_history_updated_at BEFORE UPDATE ON chat_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON chat_history TO anon, authenticated;

-- @threads - Thread management tables for chat system
CREATE TABLE IF NOT EXISTS threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user','assistant','system')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- @multi-model - Multiple responses table for model switching feature
CREATE TABLE IF NOT EXISTS message_responses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  model TEXT NOT NULL, -- The model that generated this response
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false, -- Which response is currently shown
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- @threads - Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- @multi-model - Indexes for message responses
CREATE INDEX IF NOT EXISTS idx_message_responses_message_id ON message_responses(message_id);
CREATE INDEX IF NOT EXISTS idx_message_responses_model ON message_responses(model);
CREATE INDEX IF NOT EXISTS idx_message_responses_primary ON message_responses(is_primary);

-- @threads - Enable RLS for new tables
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- @multi-model - Enable RLS for message responses
ALTER TABLE message_responses ENABLE ROW LEVEL SECURITY;

-- @threads - Thread policies (with proper error handling)
DROP POLICY IF EXISTS "Users can view own threads" ON threads;
CREATE POLICY "Users can view own threads" ON threads
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can create own threads" ON threads;
CREATE POLICY "Users can create own threads" ON threads
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can update own threads" ON threads;
CREATE POLICY "Users can update own threads" ON threads
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can delete own threads" ON threads;
CREATE POLICY "Users can delete own threads" ON threads
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

-- @threads - Message policies (with proper error handling)
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (thread_id IN (SELECT id FROM threads WHERE user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub'))));

DROP POLICY IF EXISTS "Users can create own messages" ON messages;
CREATE POLICY "Users can create own messages" ON messages
  FOR INSERT WITH CHECK (thread_id IN (SELECT id FROM threads WHERE user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub'))));

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (thread_id IN (SELECT id FROM threads WHERE user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub'))));

DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (thread_id IN (SELECT id FROM threads WHERE user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub'))));

-- @multi-model - Message response policies (with proper error handling)
DROP POLICY IF EXISTS "Users can view own message responses" ON message_responses;
CREATE POLICY "Users can view own message responses" ON message_responses
  FOR SELECT USING (message_id IN (
    SELECT m.id FROM messages m 
    JOIN threads t ON m.thread_id = t.id 
    WHERE t.user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub'))
  ));

DROP POLICY IF EXISTS "Users can create own message responses" ON message_responses;
CREATE POLICY "Users can create own message responses" ON message_responses
  FOR INSERT WITH CHECK (message_id IN (
    SELECT m.id FROM messages m 
    JOIN threads t ON m.thread_id = t.id 
    WHERE t.user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub'))
  ));

DROP POLICY IF EXISTS "Users can update own message responses" ON message_responses;
CREATE POLICY "Users can update own message responses" ON message_responses
  FOR UPDATE USING (message_id IN (
    SELECT m.id FROM messages m 
    JOIN threads t ON m.thread_id = t.id 
    WHERE t.user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub'))
  ));

DROP POLICY IF EXISTS "Users can delete own message responses" ON message_responses;
CREATE POLICY "Users can delete own message responses" ON message_responses
  FOR DELETE USING (message_id IN (
    SELECT m.id FROM messages m 
    JOIN threads t ON m.thread_id = t.id 
    WHERE t.user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub'))
  ));

-- Grant permissions for new table
GRANT ALL ON message_responses TO anon, authenticated;

-- @token-meter - Token usage table for monthly tracking
CREATE TABLE IF NOT EXISTS token_usage (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month_start)
);

-- @token-meter - Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_month_start ON token_usage(month_start);

-- @token-meter - Enable RLS for token_usage
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- @token-meter - Token usage policies
DROP POLICY IF EXISTS "Users can view own token usage" ON token_usage;
CREATE POLICY "Users can view own token usage" ON token_usage
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "Users can update own token usage" ON token_usage;
CREATE POLICY "Users can update own token usage" ON token_usage
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')));

-- @token-meter - Grant permissions for token_usage table
GRANT ALL ON token_usage TO anon, authenticated;

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