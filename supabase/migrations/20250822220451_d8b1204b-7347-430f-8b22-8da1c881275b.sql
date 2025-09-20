-- Drop all RLS policies first, then modify table structure
-- Step 1: Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can create own goals" ON goals;  
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

DROP POLICY IF EXISTS "Users can view own motivation history" ON motivation_history;
DROP POLICY IF EXISTS "Users can create own motivation history" ON motivation_history;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Step 2: Remove foreign key constraint and modify table structure
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ALTER COLUMN id TYPE text;

-- Step 3: Create new RLS policies for Clerk authentication
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

-- For profiles table
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT 
USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE 
USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT 
WITH CHECK (id = current_setting('request.jwt.claims', true)::json->>'sub');