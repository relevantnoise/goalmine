-- Update RLS policies to work with Clerk authentication
-- Clerk user IDs will be stored as text in the user_id columns

-- Drop existing RLS policies that rely on Supabase auth.uid()
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can create own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

DROP POLICY IF EXISTS "Users can view own motivation history" ON motivation_history;
DROP POLICY IF EXISTS "Users can create own motivation history" ON motivation_history;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new RLS policies that work with Clerk user IDs
-- For goals table
CREATE POLICY "Users can view own goals" ON goals 
FOR SELECT 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create own goals" ON goals 
FOR INSERT 
WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own goals" ON goals 
FOR UPDATE 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own goals" ON goals 
FOR DELETE 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- For motivation_history table
CREATE POLICY "Users can view own motivation history" ON motivation_history 
FOR SELECT 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create own motivation history" ON motivation_history 
FOR INSERT 
WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- For profiles table - change id column type to text to store Clerk user IDs
ALTER TABLE profiles ALTER COLUMN id TYPE text;

CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT 
USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE 
USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT 
WITH CHECK (id = current_setting('request.jwt.claims', true)::json->>'sub');