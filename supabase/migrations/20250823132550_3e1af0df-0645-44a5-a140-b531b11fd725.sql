-- Update RLS policies to work with Clerk authentication
-- First, drop existing policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can create their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;

-- Create new policies that work with Clerk tokens
-- The Clerk JWT contains user_id claim that we can use
CREATE POLICY "Clerk users can view their own goals" 
ON public.goals 
FOR SELECT 
USING (user_id = (current_setting('request.jwt.claims', true)::json ->> 'user_id'));

CREATE POLICY "Clerk users can create their own goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json ->> 'user_id'));

CREATE POLICY "Clerk users can update their own goals" 
ON public.goals 
FOR UPDATE 
USING (user_id = (current_setting('request.jwt.claims', true)::json ->> 'user_id'));

CREATE POLICY "Clerk users can delete their own goals" 
ON public.goals 
FOR DELETE 
USING (user_id = (current_setting('request.jwt.claims', true)::json ->> 'user_id'));

-- Also update profiles table policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Clerk users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = (current_setting('request.jwt.claims', true)::json ->> 'user_id'));

CREATE POLICY "Clerk users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = (current_setting('request.jwt.claims', true)::json ->> 'user_id'));

CREATE POLICY "Clerk users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = (current_setting('request.jwt.claims', true)::json ->> 'user_id'));