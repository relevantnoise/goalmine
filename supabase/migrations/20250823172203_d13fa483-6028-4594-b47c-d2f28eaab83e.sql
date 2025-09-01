-- Update RLS policies for goals table to work with Supabase native auth
-- First, drop the Clerk-specific policies
DROP POLICY IF EXISTS "Clerk users can view their own goals" ON goals;
DROP POLICY IF EXISTS "Clerk users can create their own goals" ON goals;
DROP POLICY IF EXISTS "Clerk users can update their own goals" ON goals;
DROP POLICY IF EXISTS "Clerk users can delete their own goals" ON goals;

-- Update existing policies to use native Supabase auth
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can create own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

-- Create new policies for native Supabase auth
CREATE POLICY "Users can view own goals" 
ON goals 
FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own goals" 
ON goals 
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own goals" 
ON goals 
FOR UPDATE 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own goals" 
ON goals 
FOR DELETE 
USING (user_id = auth.uid()::text);

-- Update profiles table policies too
DROP POLICY IF EXISTS "Clerk users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Clerk users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Clerk users can insert their own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new policies for profiles
CREATE POLICY "Users can view own profile" 
ON profiles 
FOR SELECT 
USING (id = auth.uid()::text);

CREATE POLICY "Users can update own profile" 
ON profiles 
FOR UPDATE 
USING (id = auth.uid()::text);

CREATE POLICY "Users can insert own profile" 
ON profiles 
FOR INSERT 
WITH CHECK (id = auth.uid()::text);

-- Update motivation_history policies
DROP POLICY IF EXISTS "Users can view own motivation history" ON motivation_history;
DROP POLICY IF EXISTS "Users can create own motivation history" ON motivation_history;

CREATE POLICY "Users can view own motivation history" 
ON motivation_history 
FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own motivation history" 
ON motivation_history 
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);