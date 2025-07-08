-- Clydra Chat Application Database Schema
-- This schema supports threads, messages, users, and token tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Users table - stores user information from Clerk
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    preferred_lang VARCHAR(10) DEFAULT 'en',
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'max')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Threads table - stores conversation threads
CREATE TABLE IF NOT EXISTS threads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) DEFAULT 'New Chat',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table - stores individual messages in threads
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message responses table - stores model-specific response data
CREATE TABLE IF NOT EXISTS message_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token usage table - tracks monthly token consumption
CREATE TABLE IF NOT EXISTS token_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_start DATE NOT NULL, -- Format: YYYY-MM-DD
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_start)
);

-- Daily tokens table - tracks daily token grants and usage
CREATE TABLE IF NOT EXISTS daily_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL, -- Format: YYYY-MM-DD
    tokens_granted INTEGER DEFAULT 80000, -- Daily free limit
    tokens_remaining INTEGER DEFAULT 80000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Usage meter table - tracks general usage metrics
CREATE TABLE IF NOT EXISTS usage_meter (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_tokens INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- API keys table - for future API key management
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    last_used TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API requests table - logs API usage
CREATE TABLE IF NOT EXISTS api_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    model VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    response_data JSONB,
    cost DECIMAL(10, 6) DEFAULT 0,
    latency INTEGER DEFAULT 0, -- milliseconds
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat history table - for backup/export functionality
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    messages JSONB NOT NULL,
    model VARCHAR(100),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_responses_message_id ON message_responses(message_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_month ON token_usage(user_id, month_start);
CREATE INDEX IF NOT EXISTS idx_daily_tokens_user_date ON daily_tokens(user_id, date);
CREATE INDEX IF NOT EXISTS idx_usage_meter_user_id ON usage_meter(user_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_user_id ON api_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON api_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_meter ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR ALL USING (auth.uid()::text = clerk_id);

CREATE POLICY "Users can manage own threads" ON threads
    FOR ALL USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can manage own messages" ON messages
    FOR ALL USING (
        thread_id IN (
            SELECT id FROM threads WHERE user_id = (
                SELECT id FROM users WHERE clerk_id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can view own message responses" ON message_responses
    FOR ALL USING (
        message_id IN (
            SELECT m.id FROM messages m
            JOIN threads t ON m.thread_id = t.id
            WHERE t.user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
        )
    );

CREATE POLICY "Users can manage own token usage" ON token_usage
    FOR ALL USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can manage own daily tokens" ON daily_tokens
    FOR ALL USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can manage own usage meter" ON usage_meter
    FOR ALL USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can manage own API keys" ON api_keys
    FOR ALL USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can view own API requests" ON api_requests
    FOR ALL USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can manage own chat history" ON chat_history
    FOR ALL USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_usage_updated_at BEFORE UPDATE ON token_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_tokens_updated_at BEFORE UPDATE ON daily_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update thread updated_at when messages are added
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE threads 
    SET updated_at = NOW() 
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_thread_on_message_insert 
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_thread_timestamp();

-- Function to create daily token allocation
CREATE OR REPLACE FUNCTION ensure_daily_tokens(user_uuid UUID, target_date DATE)
RETURNS daily_tokens AS $$
DECLARE
    result daily_tokens;
BEGIN
    INSERT INTO daily_tokens (user_id, date, tokens_granted, tokens_remaining)
    VALUES (user_uuid, target_date, 80000, 80000)
    ON CONFLICT (user_id, date) DO NOTHING
    RETURNING * INTO result;
    
    IF result IS NULL THEN
        SELECT * INTO result FROM daily_tokens 
        WHERE user_id = user_uuid AND date = target_date;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to grant daily tokens (reset daily limits)
CREATE OR REPLACE FUNCTION grant_daily_tokens(user_uuid UUID, tokens_to_grant INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_tokens (user_id, date, tokens_granted, tokens_remaining)
    VALUES (user_uuid, CURRENT_DATE, tokens_to_grant, tokens_to_grant)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET 
        tokens_granted = EXCLUDED.tokens_granted,
        tokens_remaining = EXCLUDED.tokens_remaining,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert default data for testing (optional)
-- This creates a sample user and thread for testing purposes
-- Remove this in production

-- Sample user (replace with your actual Clerk user ID)
-- INSERT INTO users (clerk_id, email, first_name, last_name) 
-- VALUES ('user_sample123', 'test@example.com', 'Test', 'User')
-- ON CONFLICT (clerk_id) DO NOTHING;

-- Sample thread and messages for testing
-- WITH sample_user AS (
--     SELECT id FROM users WHERE clerk_id = 'user_sample123' LIMIT 1
-- ),
-- sample_thread AS (
--     INSERT INTO threads (user_id, title) 
--     SELECT id, 'Welcome Chat' FROM sample_user
--     RETURNING id
-- )
-- INSERT INTO messages (thread_id, role, content)
-- SELECT st.id, 'user', 'Hello, this is a test message!'
-- FROM sample_thread st
-- UNION ALL
-- SELECT st.id, 'assistant', 'Hello! I''m your AI assistant. How can I help you today?'
-- FROM sample_thread st;

-- Grant execute permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to service role (for server-side operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;