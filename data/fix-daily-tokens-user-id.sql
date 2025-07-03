-- Fix daily_tokens table to support Clerk text IDs
-- This script converts user_id from UUID to TEXT for Clerk compatibility

-- Step 1: Drop all RLS policies that reference user_id
DROP POLICY IF EXISTS "Users can view own daily tokens" ON daily_tokens;
DROP POLICY IF EXISTS "Users can manage own daily tokens" ON daily_tokens;

-- Step 2: Temporarily disable RLS to avoid conflicts
ALTER TABLE daily_tokens DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop the foreign key constraint
ALTER TABLE daily_tokens DROP CONSTRAINT IF EXISTS daily_tokens_user_id_fkey;

-- Step 4: Drop the primary key constraint
ALTER TABLE daily_tokens DROP CONSTRAINT IF EXISTS daily_tokens_pkey;

-- Step 5: Convert user_id column from UUID to TEXT
ALTER TABLE daily_tokens ALTER COLUMN user_id TYPE TEXT;

-- Step 6: Recreate the primary key constraint
ALTER TABLE daily_tokens ADD CONSTRAINT daily_tokens_pkey PRIMARY KEY (user_id, date);

-- Step 7: Re-enable RLS
ALTER TABLE daily_tokens ENABLE ROW LEVEL SECURITY;

-- Step 8: Recreate RLS policies with updated logic to support both Clerk IDs and Supabase UUIDs
CREATE POLICY "Users can view own daily tokens" ON daily_tokens
  FOR SELECT USING (
    user_id = (auth.jwt() ->> 'sub') OR 
    user_id IN (SELECT id::text FROM users WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

CREATE POLICY "Users can manage own daily tokens" ON daily_tokens
  FOR ALL USING (
    user_id = (auth.jwt() ->> 'sub') OR 
    user_id IN (SELECT id::text FROM users WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

-- Grant permissions
GRANT ALL ON daily_tokens TO anon, authenticated; 