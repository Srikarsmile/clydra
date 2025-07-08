-- Create all tables for Clydra Chat Application
-- Run this after reset-schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
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

-- Threads table
CREATE TABLE threads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) DEFAULT 'New Chat',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message responses table
CREATE TABLE message_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token usage table
CREATE TABLE token_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_start DATE NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_start)
);

-- Daily tokens table
CREATE TABLE daily_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tokens_granted INTEGER DEFAULT 80000,
    tokens_remaining INTEGER DEFAULT 80000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Usage meter table
CREATE TABLE usage_meter (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_tokens INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_threads_user_id ON threads(user_id);
CREATE INDEX idx_threads_updated_at ON threads(updated_at DESC);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_message_responses_message_id ON message_responses(message_id);
CREATE INDEX idx_token_usage_user_month ON token_usage(user_id, month_start);
CREATE INDEX idx_daily_tokens_user_date ON daily_tokens(user_id, date);
CREATE INDEX idx_usage_meter_user_id ON usage_meter(user_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_meter ENABLE ROW LEVEL SECURITY;

-- Service role policies (allows backend to access everything)
CREATE POLICY "Service role can do everything" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON threads FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON messages FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON message_responses FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON token_usage FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON daily_tokens FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON usage_meter FOR ALL TO service_role USING (true);

-- Functions for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at 
    BEFORE UPDATE ON threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_usage_updated_at 
    BEFORE UPDATE ON token_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_tokens_updated_at 
    BEFORE UPDATE ON daily_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update thread timestamp when messages are added
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

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;