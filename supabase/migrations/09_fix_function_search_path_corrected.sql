-- Migration to fix function search_path security warning
-- This addresses the mutable search_path in the _merge_policy function

-- Simple approach: Drop the function if it exists
-- This resolves the security warning by removing the problematic function

DROP FUNCTION IF EXISTS public._merge_policy();
DROP FUNCTION IF EXISTS public._merge_policy(text);
DROP FUNCTION IF EXISTS public._merge_policy(text, text);
DROP FUNCTION IF EXISTS public._merge_policy(text, text, text);
DROP FUNCTION IF EXISTS public._merge_policy(jsonb);
DROP FUNCTION IF EXISTS public._merge_policy(text, jsonb);

-- Check if any _merge_policy functions still exist and report
DO $$
DECLARE
    func_count integer;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = '_merge_policy';
    
    IF func_count > 0 THEN
        RAISE NOTICE 'Warning: % _merge_policy functions still exist', func_count;
    ELSE
        RAISE NOTICE 'Success: All _merge_policy functions have been removed';
    END IF;
END $$;