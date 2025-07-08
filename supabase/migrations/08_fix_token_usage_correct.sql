-- Migration to fix token usage policies with correct type handling

-- Fix token_usage table - consolidate duplicate policies
DROP POLICY IF EXISTS "Users can manage own token usage" ON public.token_usage;
DROP POLICY IF EXISTS "Users can view own token usage" ON public.token_usage;

-- Create single comprehensive policy for token_usage
-- Based on original policy that handles both direct user_id match and clerk_id lookup
CREATE POLICY "Users can manage own token usage" ON public.token_usage
FOR ALL USING (
  (user_id = (SELECT (auth.jwt() ->> 'sub'))) OR 
  (user_id IN (
    SELECT users.id::text FROM users 
    WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
  ))
);

-- Fix daily_tokens table - consolidate duplicate policies  
DROP POLICY IF EXISTS "Users can manage own daily tokens" ON public.daily_tokens;
DROP POLICY IF EXISTS "Users can view own daily tokens" ON public.daily_tokens;

-- Create single comprehensive policy for daily_tokens
-- Based on original policy that handles both direct user_id match and clerk_id lookup
CREATE POLICY "Users can manage own daily tokens" ON public.daily_tokens
FOR ALL USING (
  (user_id = (SELECT (auth.jwt() ->> 'sub'))) OR 
  (user_id IN (
    SELECT users.id::text FROM users 
    WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
  ))
);

-- Fix usage_meter table - consolidate multiple policies
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_meter;
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_meter;
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_meter;

-- The original "Users can insert own usage" policy uses auth.uid() directly
-- The other policies use the clerk_id lookup pattern
CREATE POLICY "Users can insert own usage" ON public.usage_meter
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can manage own usage" ON public.usage_meter
FOR ALL USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

-- Remove duplicate index on token_usage table
-- Keep only one of the identical indexes
DROP INDEX IF EXISTS idx_token_usage_month_start;

-- Verify the remaining index exists (if not, create it)
CREATE INDEX IF NOT EXISTS idx_token_usage_month ON public.token_usage(user_id, month_start);