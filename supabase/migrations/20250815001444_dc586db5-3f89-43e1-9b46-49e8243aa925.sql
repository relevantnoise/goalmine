-- Drop existing RLS policies that depend on user_id columns
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can create own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;

DROP POLICY IF EXISTS "Users can view own motivation history" ON public.motivation_history;
DROP POLICY IF EXISTS "Users can create own motivation history" ON public.motivation_history;

-- Drop foreign key constraints
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_user_id_fkey;
ALTER TABLE public.motivation_history DROP CONSTRAINT IF EXISTS motivation_history_user_id_fkey;
ALTER TABLE public.subscribers DROP CONSTRAINT IF EXISTS subscribers_user_id_fkey;

-- Update goals table to use TEXT for user_id instead of UUID
ALTER TABLE public.goals 
ALTER COLUMN user_id TYPE TEXT;

-- Update motivation_history table to use TEXT for user_id instead of UUID  
ALTER TABLE public.motivation_history 
ALTER COLUMN user_id TYPE TEXT;

-- Update subscribers table to use TEXT for user_id instead of UUID
ALTER TABLE public.subscribers 
ALTER COLUMN user_id TYPE TEXT;

-- Recreate RLS policies for goals table using Clerk user ID from JWT
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

-- Recreate RLS policies for motivation_history table
CREATE POLICY "Users can view own motivation history" 
ON public.motivation_history 
FOR SELECT 
USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create own motivation history" 
ON public.motivation_history 
FOR INSERT 
WITH CHECK (user_id = auth.jwt() ->> 'sub');