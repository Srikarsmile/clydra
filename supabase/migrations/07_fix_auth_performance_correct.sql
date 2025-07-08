-- Migration to fix auth RLS initplan warnings with proper type handling
-- This wraps auth functions in SELECT subqueries and handles type casting correctly

-- First, let's check what we're working with by examining the existing policies
-- Most policies use auth.jwt() ->> 'sub' which returns text
-- Some use auth.uid() which returns uuid

-- Fix api_keys table policies
DROP POLICY IF EXISTS "Users can create own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view own api keys" ON public.api_keys;

CREATE POLICY "Users can create own api keys" ON public.api_keys
FOR INSERT WITH CHECK (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can delete own api keys" ON public.api_keys
FOR DELETE USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can update own api keys" ON public.api_keys
FOR UPDATE USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can view own api keys" ON public.api_keys
FOR SELECT USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

-- Fix api_requests table policies
DROP POLICY IF EXISTS "Users can create own api requests" ON public.api_requests;
DROP POLICY IF EXISTS "Users can view own api requests" ON public.api_requests;

CREATE POLICY "Users can create own api requests" ON public.api_requests
FOR INSERT WITH CHECK (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can view own api requests" ON public.api_requests
FOR SELECT USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

-- Fix projects table policies
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;

CREATE POLICY "Users can create own projects" ON public.projects
FOR INSERT WITH CHECK (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can delete own projects" ON public.projects
FOR DELETE USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can update own projects" ON public.projects
FOR UPDATE USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can view own projects" ON public.projects
FOR SELECT USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

-- Fix threads table policies
DROP POLICY IF EXISTS "Users can create own threads" ON public.threads;
DROP POLICY IF EXISTS "Users can delete own threads" ON public.threads;
DROP POLICY IF EXISTS "Users can update own threads" ON public.threads;
DROP POLICY IF EXISTS "Users can view own threads" ON public.threads;

CREATE POLICY "Users can create own threads" ON public.threads
FOR INSERT WITH CHECK (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can delete own threads" ON public.threads
FOR DELETE USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can update own threads" ON public.threads
FOR UPDATE USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can view own threads" ON public.threads
FOR SELECT USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

-- Fix attachments table policies
DROP POLICY IF EXISTS "Users can create own attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can delete own attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can update own attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can view own attachments" ON public.attachments;

CREATE POLICY "Users can create own attachments" ON public.attachments
FOR INSERT WITH CHECK (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can delete own attachments" ON public.attachments
FOR DELETE USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can update own attachments" ON public.attachments
FOR UPDATE USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can view own attachments" ON public.attachments
FOR SELECT USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

-- Fix chat_history table policies
DROP POLICY IF EXISTS "Users can create own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Users can delete own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Users can update own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Users can view own chat history" ON public.chat_history;

CREATE POLICY "Users can create own chat history" ON public.chat_history
FOR INSERT WITH CHECK (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can delete own chat history" ON public.chat_history
FOR DELETE USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can update own chat history" ON public.chat_history
FOR UPDATE USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can view own chat history" ON public.chat_history
FOR SELECT USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

-- Fix user_generations table policies
DROP POLICY IF EXISTS "Users can delete own generations" ON public.user_generations;
DROP POLICY IF EXISTS "Users can update own generations" ON public.user_generations;
DROP POLICY IF EXISTS "Users can view own generations" ON public.user_generations;
DROP POLICY IF EXISTS "Users may INSERT own generations" ON public.user_generations;

CREATE POLICY "Users can delete own generations" ON public.user_generations
FOR DELETE USING (user_id IN (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users can update own generations" ON public.user_generations
FOR UPDATE USING ((SELECT (auth.jwt() ->> 'sub')) = (
  SELECT users.clerk_id FROM users 
  WHERE users.id = user_generations.user_id
));

CREATE POLICY "Users can view own generations" ON public.user_generations
FOR SELECT USING ((SELECT (auth.jwt() ->> 'sub')) = (
  SELECT users.clerk_id FROM users 
  WHERE users.id = user_generations.user_id
));

CREATE POLICY "Users may INSERT own generations" ON public.user_generations
FOR INSERT WITH CHECK (user_id = (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

-- Fix ratelimit table policies (this one uses auth.uid directly)
DROP POLICY IF EXISTS "Own rows" ON public.ratelimit;

CREATE POLICY "Own rows" ON public.ratelimit
FOR ALL USING (user_id = (SELECT auth.uid()));

-- Fix users table policies  
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

CREATE POLICY "Users can view own data" ON public.users
FOR ALL USING (clerk_id = (SELECT (auth.jwt() ->> 'sub')));

-- Fix user_credit_balances table policies
DROP POLICY IF EXISTS "Users can insert own credit balances" ON public.user_credit_balances;
DROP POLICY IF EXISTS "Users may SELECT own credit balances" ON public.user_credit_balances;
DROP POLICY IF EXISTS "Users may UPDATE own credit balances" ON public.user_credit_balances;

CREATE POLICY "Users can insert own credit balances" ON public.user_credit_balances
FOR INSERT WITH CHECK ((SELECT (auth.jwt() ->> 'sub')) = (
  SELECT users.clerk_id FROM users 
  WHERE users.id = user_credit_balances.user_id
));

CREATE POLICY "Users may SELECT own credit balances" ON public.user_credit_balances
FOR SELECT USING (user_id = (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

CREATE POLICY "Users may UPDATE own credit balances" ON public.user_credit_balances
FOR UPDATE USING (user_id = (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

-- Fix credit_transactions table policies
DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users may INSERT own credit transactions" ON public.credit_transactions;

CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
FOR SELECT USING ((SELECT (auth.jwt() ->> 'sub')) = (
  SELECT users.clerk_id FROM users 
  WHERE users.id = credit_transactions.user_id
));

CREATE POLICY "Users may INSERT own credit transactions" ON public.credit_transactions
FOR INSERT WITH CHECK (user_id = (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));

-- Fix user_purchases table policies
DROP POLICY IF EXISTS "Users can update own purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Users may INSERT own purchases" ON public.user_purchases;

CREATE POLICY "Users can update own purchases" ON public.user_purchases
FOR UPDATE USING ((SELECT (auth.jwt() ->> 'sub')) = (
  SELECT users.clerk_id FROM users 
  WHERE users.id = user_purchases.user_id
));

CREATE POLICY "Users can view own purchases" ON public.user_purchases
FOR SELECT USING ((SELECT (auth.jwt() ->> 'sub')) = (
  SELECT users.clerk_id FROM users 
  WHERE users.id = user_purchases.user_id
));

CREATE POLICY "Users may INSERT own purchases" ON public.user_purchases
FOR INSERT WITH CHECK (user_id = (
  SELECT users.id FROM users 
  WHERE users.clerk_id = (SELECT (auth.jwt() ->> 'sub'))
));