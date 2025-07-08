-- Migration to fix complex policies with joins and message-based access patterns

-- Fix messages table policies (based on thread ownership)
DROP POLICY IF EXISTS "Users can create own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;

CREATE POLICY "Users can create own messages" ON public.messages
FOR INSERT WITH CHECK (thread_id IN (
  SELECT threads.id FROM threads 
  WHERE threads.user_id IN (
    SELECT users.id FROM users 
    WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
  )
));

CREATE POLICY "Users can delete own messages" ON public.messages
FOR DELETE USING (thread_id IN (
  SELECT threads.id FROM threads 
  WHERE threads.user_id IN (
    SELECT users.id FROM users 
    WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
  )
));

CREATE POLICY "Users can update own messages" ON public.messages
FOR UPDATE USING (thread_id IN (
  SELECT threads.id FROM threads 
  WHERE threads.user_id IN (
    SELECT users.id FROM users 
    WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
  )
));

CREATE POLICY "Users can view own messages" ON public.messages
FOR SELECT USING (thread_id IN (
  SELECT threads.id FROM threads 
  WHERE threads.user_id IN (
    SELECT users.id FROM users 
    WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
  )
));

-- Fix message_responses table policies (based on message -> thread ownership)
DROP POLICY IF EXISTS "Users can create own message responses" ON public.message_responses;
DROP POLICY IF EXISTS "Users can delete own message responses" ON public.message_responses;
DROP POLICY IF EXISTS "Users can update own message responses" ON public.message_responses;
DROP POLICY IF EXISTS "Users can view own message responses" ON public.message_responses;

CREATE POLICY "Users can create own message responses" ON public.message_responses
FOR INSERT WITH CHECK (message_id IN (
  SELECT m.id FROM messages m 
  JOIN threads t ON m.thread_id = t.id 
  WHERE t.user_id IN (
    SELECT users.id FROM users 
    WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
  )
));

CREATE POLICY "Users can delete own message responses" ON public.message_responses
FOR DELETE USING (message_id IN (
  SELECT m.id FROM messages m 
  JOIN threads t ON m.thread_id = t.id 
  WHERE t.user_id IN (
    SELECT users.id FROM users 
    WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
  )
));

CREATE POLICY "Users can update own message responses" ON public.message_responses
FOR UPDATE USING (message_id IN (
  SELECT m.id FROM messages m 
  JOIN threads t ON m.thread_id = t.id 
  WHERE t.user_id IN (
    SELECT users.id FROM users 
    WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
  )
));

CREATE POLICY "Users can view own message responses" ON public.message_responses
FOR SELECT USING (message_id IN (
  SELECT m.id FROM messages m 
  JOIN threads t ON m.thread_id = t.id 
  WHERE t.user_id IN (
    SELECT users.id FROM users 
    WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
  )
));

-- Fix message_attachments table policies (based on message -> thread ownership)
DROP POLICY IF EXISTS "Users can delete their own message attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Users may INSERT own message attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Users may SELECT own message attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Users may UPDATE own message attachments" ON public.message_attachments;

CREATE POLICY "Users can delete their own message attachments" ON public.message_attachments
FOR DELETE USING (message_id IN (
  SELECT m.id FROM messages m 
  JOIN threads t ON m.thread_id = t.id 
  JOIN users u ON t.user_id = u.id 
  WHERE u.clerk_id = (SELECT auth.jwt() ->> 'sub')
));

CREATE POLICY "Users may INSERT own message attachments" ON public.message_attachments
FOR INSERT WITH CHECK (message_id IN (
  SELECT m.id FROM messages m 
  JOIN threads t ON t.id = m.thread_id 
  WHERE t.user_id = (
    SELECT users.id FROM users 
    WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
  )
));

CREATE POLICY "Users may SELECT own message attachments" ON public.message_attachments
FOR SELECT USING (message_id IN (
  SELECT m.id FROM messages m 
  JOIN threads t ON t.id = m.thread_id 
  WHERE t.user_id = (
    SELECT users.id FROM users 
    WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
  )
));

CREATE POLICY "Users may UPDATE own message attachments" ON public.message_attachments
FOR UPDATE USING (message_id IN (
  SELECT m.id FROM messages m 
  JOIN threads t ON t.id = m.thread_id 
  WHERE t.user_id = (
    SELECT users.id FROM users 
    WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
  )
));