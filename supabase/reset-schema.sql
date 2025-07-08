-- Reset Database Schema - Use with CAUTION!
-- This will delete ALL data and recreate tables from scratch

-- Drop all tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS message_responses CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS threads CASCADE;
DROP TABLE IF EXISTS token_usage CASCADE;
DROP TABLE IF EXISTS daily_tokens CASCADE;
DROP TABLE IF EXISTS usage_meter CASCADE;
DROP TABLE IF EXISTS api_requests CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS chat_history CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_thread_timestamp() CASCADE;
DROP FUNCTION IF EXISTS ensure_daily_tokens(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS grant_daily_tokens(UUID, INTEGER) CASCADE;

-- Now run the main schema.sql file after this