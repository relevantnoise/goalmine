-- Remove foreign key constraint and update profiles table for Clerk
-- Drop the existing foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Change the id column type to text for Clerk user IDs
ALTER TABLE profiles ALTER COLUMN id TYPE text;

-- Update existing RLS policies for goals table to work with Clerk JWT
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can create own goals" ON goals;  
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

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

-- Update RLS policies for motivation_history table
DROP POLICY IF EXISTS "Users can view own motivation history" ON motivation_history;
DROP POLICY IF EXISTS "Users can create own motivation history" ON motivation_history;

CREATE POLICY "Users can view own motivation history" ON motivation_history 
FOR SELECT 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create own motivation history" ON motivation_history 
FOR INSERT 
WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Update RLS policies for profiles table  
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT 
USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE 
USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT 
WITH CHECK (id = current_setting('request.jwt.claims', true)::json->>'sub');