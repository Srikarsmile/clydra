-- Fix existing database schema - adds missing columns and constraints
-- Run this if you get "column does not exist" errors

-- Add missing columns to existing tables
ALTER TABLE threads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_lang VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free';

-- Add constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_plan_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'pro', 'max'));
    END IF;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS message_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_start DATE NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_start)
);

CREATE TABLE IF NOT EXISTS daily_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tokens_granted INTEGER DEFAULT 80000,
    tokens_remaining INTEGER DEFAULT 80000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS usage_meter (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_tokens INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers if they don't exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_threads_updated_at ON threads;    
CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_token_usage_updated_at ON token_usage;
CREATE TRIGGER update_token_usage_updated_at BEFORE UPDATE ON token_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_tokens_updated_at ON daily_tokens;
CREATE TRIGGER update_daily_tokens_updated_at BEFORE UPDATE ON daily_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Thread timestamp update function
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE threads 
    SET updated_at = NOW() 
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_thread_on_message_insert ON messages;
CREATE TRIGGER update_thread_on_message_insert 
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_thread_timestamp();

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Simple policies for testing (you can make these more restrictive later)
DROP POLICY IF EXISTS "Enable all for service role" ON users;
CREATE POLICY "Enable all for service role" ON users
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Enable all for service role" ON threads;
CREATE POLICY "Enable all for service role" ON threads
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Enable all for service role" ON messages;
CREATE POLICY "Enable all for service role" ON messages
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Enable all for service role" ON message_responses;
CREATE POLICY "Enable all for service role" ON message_responses
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Enable all for service role" ON token_usage;
CREATE POLICY "Enable all for service role" ON token_usage
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Enable all for service role" ON daily_tokens;
CREATE POLICY "Enable all for service role" ON daily_tokens
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Enable all for service role" ON usage_meter;
CREATE POLICY "Enable all for service role" ON usage_meter
    FOR ALL TO service_role USING (true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;