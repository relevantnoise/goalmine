-- Migration to support Firebase Authentication
-- Add missing columns for Firebase integration

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS firebase_user_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

-- Rename trial_expires_at to trial_ends_at for consistency with useAuth
ALTER TABLE profiles RENAME COLUMN trial_expires_at TO trial_ends_at;

-- Update any existing records to have proper trial status
UPDATE profiles 
SET subscription_status = 'trial' 
WHERE subscription_status IS NULL;

-- Add index for Firebase user ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_firebase_user_id ON profiles(firebase_user_id);

-- Drop clerk_uuid column as we're moving to Firebase
ALTER TABLE profiles DROP COLUMN IF EXISTS clerk_uuid;

-- Add check constraint for subscription status
ALTER TABLE profiles 
ADD CONSTRAINT check_subscription_status 
CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired'));

COMMENT ON TABLE profiles IS 'User profiles with Firebase authentication integration';
COMMENT ON COLUMN profiles.firebase_user_id IS 'Firebase user ID for authentication sync';
COMMENT ON COLUMN profiles.subscription_status IS 'Current subscription status: trial, active, cancelled, or expired';