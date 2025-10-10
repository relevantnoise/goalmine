-- Fix daily_nudges table to work with Firebase authentication
-- Change user_id from UUID to TEXT to match Firebase UIDs

-- Drop the foreign key constraint that references auth.users
ALTER TABLE daily_nudges DROP CONSTRAINT IF EXISTS daily_nudges_user_id_fkey;

-- Change user_id column from UUID to TEXT
ALTER TABLE daily_nudges ALTER COLUMN user_id TYPE TEXT;

-- Add foreign key constraint to profiles table instead
ALTER TABLE daily_nudges 
ADD CONSTRAINT daily_nudges_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update RLS policies to work with Firebase auth
DROP POLICY IF EXISTS "Users can view their own nudge records" ON daily_nudges;
DROP POLICY IF EXISTS "Users can insert their own nudge records" ON daily_nudges;
DROP POLICY IF EXISTS "Users can update their own nudge records" ON daily_nudges;

-- Create new RLS policies that work with profile lookups
CREATE POLICY "Users can view their own nudge records"
  ON daily_nudges FOR SELECT
  USING (user_id IN (
    SELECT id FROM profiles WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Users can insert their own nudge records" 
  ON daily_nudges FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Users can update their own nudge records"
  ON daily_nudges FOR UPDATE
  USING (user_id IN (
    SELECT id FROM profiles WHERE email = auth.jwt() ->> 'email'
  ));

-- Comment the table for clarity
COMMENT ON TABLE daily_nudges IS 'Daily nudge tracking with Firebase UID support';
COMMENT ON COLUMN daily_nudges.user_id IS 'Firebase UID from profiles.id, not auth.users UUID';