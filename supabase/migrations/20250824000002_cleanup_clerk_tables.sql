-- Clean up unused Clerk integration tables and references
-- These were left over from a failed Clerk integration attempt

-- Drop the clerk_users table if it exists (no data should be lost since it's not being used)
DROP TABLE IF EXISTS clerk_users CASCADE;

-- Remove any clerk_uuid references from profiles table that are not being used
-- First check if the column exists and is unused
DO $$ 
BEGIN
    -- Check if clerk_uuid column exists in profiles table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'clerk_uuid') THEN
        
        -- Check if any profiles actually use clerk_uuid (should be null for all records)
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_uuid IS NOT NULL) THEN
            -- Safe to drop the column since it's not being used
            ALTER TABLE profiles DROP COLUMN IF EXISTS clerk_uuid;
            RAISE NOTICE 'Dropped unused clerk_uuid column from profiles table';
        ELSE
            RAISE NOTICE 'clerk_uuid column contains data, skipping drop';
        END IF;
    END IF;
END $$;

-- Add better indexing for performance on frequently queried tables
-- These indexes will improve query performance for the main application functions

-- Index for goals queries (user_id + is_active is frequently queried together)
CREATE INDEX IF NOT EXISTS idx_goals_user_active ON goals(user_id, is_active) WHERE is_active = true;

-- Index for motivation_history queries (goal_id + created_at for daily lookups)
CREATE INDEX IF NOT EXISTS idx_motivation_history_goal_date ON motivation_history(goal_id, created_at);

-- Index for subscribers table (user_id + subscribed status)
CREATE INDEX IF NOT EXISTS idx_subscribers_user_subscribed ON subscribers(user_id, subscribed);

-- Index for profiles (email lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Update statistics
ANALYZE goals;
ANALYZE motivation_history;
ANALYZE subscribers;
ANALYZE profiles;
ANALYZE daily_nudges;
ANALYZE email_deliveries;