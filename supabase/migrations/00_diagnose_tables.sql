-- Diagnostic script to check table structures before fixing RLS policies
-- Run this first to understand your table structures

-- Check if tables exist and their column names
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN (
    'api_keys',
    'api_requests', 
    'projects',
    'user_credit_balances',
    'credit_transactions',
    'user_purchases',
    'user_generations',
    'chat_history',
    'threads',
    'messages',
    'token_usage',
    'usage_meter',
    'message_responses',
    'daily_tokens',
    'message_attachments',
    'attachments',
    'ratelimit'
  )
ORDER BY table_name, ordinal_position;

-- Check existing RLS policies to understand their structure
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;