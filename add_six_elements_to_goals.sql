-- Add Six Elements support to goals table
-- Run this in the Supabase SQL Editor

-- Add the circle_type column and other 6 Elements fields to goals table
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS circle_type TEXT,
ADD COLUMN IF NOT EXISTS weekly_commitment_hours DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS circle_interview_data JSONB;

-- Now add the constraint with all 6 Elements
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_circle_type_check;
ALTER TABLE goals ADD CONSTRAINT goals_circle_type_check 
CHECK (circle_type IN (
  'Work',
  'Sleep', 
  'Friends & Family',
  'Health & Fitness',
  'Personal Development',
  'Spiritual'
));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_goals_circle_type ON goals(circle_type);