-- Migration script to fix old threads linked to Clerk IDs
-- This script updates threads.user_id from Clerk IDs to Supabase UUIDs
-- Fixed version to handle uuid/text type casting issues

-- First, let's diagnose what we're working with
-- Run this query to check the current state:
SELECT 
  t.id as thread_id,
  t.user_id as thread_user_id,
  CASE 
    WHEN t.user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN 'UUID' 
    ELSE 'CLERK_ID' 
  END as user_id_type,
  u.id as supabase_uuid,
  u.clerk_id,
  COUNT(m.id) as message_count
FROM threads t
LEFT JOIN users u ON t.user_id::text = u.clerk_id OR t.user_id = u.id
LEFT JOIN messages m ON m.thread_id = t.id
GROUP BY t.id, t.user_id, u.id, u.clerk_id
ORDER BY t.created_at DESC;

-- Step 1: Update threads where user_id is a Clerk ID (not a UUID format)
-- We need to cast everything to text for the comparison
UPDATE threads 
SET user_id = users.id
FROM users
WHERE threads.user_id::text = users.clerk_id
  AND NOT (threads.user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Step 2: Verify the migration worked
-- Check that all threads now have valid UUID user_ids
SELECT 
  COUNT(*) as total_threads,
  COUNT(CASE WHEN user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as valid_uuid_threads,
  COUNT(CASE WHEN NOT (user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN 1 END) as invalid_threads
FROM threads;

-- Step 3: Check for orphaned threads (threads without valid users)
-- These are threads that couldn't be mapped to any user
SELECT 
  t.id as orphaned_thread_id,
  t.user_id as orphaned_user_id,
  t.title,
  t.created_at,
  COUNT(m.id) as message_count
FROM threads t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN messages m ON m.thread_id = t.id
WHERE u.id IS NULL
GROUP BY t.id, t.user_id, t.title, t.created_at
ORDER BY t.created_at DESC;

-- Step 4: Clean up orphaned threads (OPTIONAL - BE CAREFUL!)
-- Only run this if you're sure you want to delete threads without valid users
-- DELETE FROM threads 
-- WHERE id IN (
--   SELECT t.id
--   FROM threads t
--   LEFT JOIN users u ON t.user_id = u.id
--   WHERE u.id IS NULL
-- );

-- Step 5: Final verification - check thread-user relationships
SELECT 
  t.id as thread_id,
  t.user_id,
  u.clerk_id,
  u.email,
  COUNT(m.id) as message_count,
  t.created_at
FROM threads t
JOIN users u ON t.user_id = u.id
LEFT JOIN messages m ON m.thread_id = t.id
GROUP BY t.id, t.user_id, u.clerk_id, u.email, t.created_at
ORDER BY t.created_at DESC
LIMIT 10; 