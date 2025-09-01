-- Simple RLS policies for direct database access
-- This file can be run directly in Supabase SQL editor

-- Enable RLS on tables if not already enabled
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own goals" ON goals;
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;

DROP POLICY IF EXISTS "Users can manage their own motivation history" ON motivation_history;
DROP POLICY IF EXISTS "Users can view their own motivation history" ON motivation_history;
DROP POLICY IF EXISTS "Users can insert their own motivation history" ON motivation_history;

-- Simple, permissive policies for goals table
CREATE POLICY "Users can manage their own goals" ON goals
FOR ALL USING (
  auth.uid()::text = user_id 
  OR auth.jwt() ->> 'email' = user_id
);

-- Simple, permissive policies for motivation_history table  
CREATE POLICY "Users can manage their own motivation history" ON motivation_history
FOR ALL USING (
  auth.uid()::text = user_id 
  OR auth.jwt() ->> 'email' = user_id
);

-- Simple, permissive policies for profiles table
CREATE POLICY "Users can manage their own profile" ON profiles
FOR ALL USING (
  auth.uid()::text = id 
  OR auth.jwt() ->> 'email' = email
);

-- Simple, permissive policies for subscribers table  
CREATE POLICY "Users can manage their own subscription" ON subscribers
FOR ALL USING (
  auth.uid()::text = user_id 
  OR auth.jwt() ->> 'email' = user_id
  OR auth.jwt() ->> 'email' = email
);

-- Grant necessary permissions
GRANT ALL ON goals TO authenticated;
GRANT ALL ON motivation_history TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON subscribers TO authenticated;