-- Update RLS policies to work with Clerk authentication
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can create own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;

DROP POLICY IF EXISTS "Users can view own motivation history" ON public.motivation_history;
DROP POLICY IF EXISTS "Users can create own motivation history" ON public.motivation_history;

-- Create new policies that work with Clerk's JWT format
-- Goals table policies
CREATE POLICY "Users can view own goals" 
ON public.goals 
FOR SELECT 
USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.jwt() ->> 'user_id', ''));

CREATE POLICY "Users can create own goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (user_id = COALESCE(auth.jwt() ->> 'sub', auth.jwt() ->> 'user_id', ''));

CREATE POLICY "Users can update own goals" 
ON public.goals 
FOR UPDATE 
USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.jwt() ->> 'user_id', ''));

CREATE POLICY "Users can delete own goals" 
ON public.goals 
FOR DELETE 
USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.jwt() ->> 'user_id', ''));

-- Motivation history table policies
CREATE POLICY "Users can view own motivation history" 
ON public.motivation_history 
FOR SELECT 
USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.jwt() ->> 'user_id', ''));

CREATE POLICY "Users can create own motivation history" 
ON public.motivation_history 
FOR INSERT 
WITH CHECK (user_id = COALESCE(auth.jwt() ->> 'sub', auth.jwt() ->> 'user_id', ''));