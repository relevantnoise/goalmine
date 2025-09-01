-- Fix RLS policies for goals table to work with Clerk authentication
-- The issue is that Clerk JWTs have the user ID in the 'sub' claim,
-- but the current policies use auth.jwt() which expects Supabase Auth format

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can create own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;

-- Create new policies that work with Clerk JWT
CREATE POLICY "Users can view own goals" 
ON public.goals 
FOR SELECT 
USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create own goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own goals" 
ON public.goals 
FOR UPDATE 
USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own goals" 
ON public.goals 
FOR DELETE 
USING (user_id = auth.jwt() ->> 'sub');