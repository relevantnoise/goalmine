-- Add streak insurance system to goals table
-- Migration: Add streak insurance and recovery tracking

-- Add new columns to goals table for streak insurance
ALTER TABLE goals ADD COLUMN IF NOT EXISTS streak_insurance_days INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS last_insurance_earned_at DATE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_on_planned_break BOOLEAN DEFAULT false;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS planned_break_until DATE;

-- Create streak_recoveries table for tracking recovery history
CREATE TABLE IF NOT EXISTS streak_recoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  recovery_date DATE NOT NULL,
  streak_before INTEGER NOT NULL,
  recovery_type TEXT NOT NULL, -- 'insurance', 'grace_period', 'manual'
  days_recovered INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_streak_recoveries_goal_id ON streak_recoveries(goal_id);
CREATE INDEX IF NOT EXISTS idx_streak_recoveries_user_id ON streak_recoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_recoveries_date ON streak_recoveries(recovery_date);

-- Add RLS policies for streak_recoveries table
ALTER TABLE streak_recoveries ENABLE ROW LEVEL SECURITY;

-- Users can view their own recovery records
CREATE POLICY "Users can view own streak recoveries" ON streak_recoveries
  FOR SELECT USING (user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'user_id'::text));

-- Service role can insert recovery records (for the database function)
CREATE POLICY "Service role can insert streak recoveries" ON streak_recoveries
  FOR INSERT WITH CHECK (true);

-- Update existing goals to have 0 insurance days (already the default, but being explicit)
UPDATE goals SET streak_insurance_days = 0 WHERE streak_insurance_days IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN goals.streak_insurance_days IS 'Number of streak insurance days available (max 3). Earned every 7 consecutive check-ins.';
COMMENT ON COLUMN goals.last_insurance_earned_at IS 'Date when last insurance day was earned';
COMMENT ON COLUMN goals.is_on_planned_break IS 'Whether the goal is currently on a planned break';
COMMENT ON COLUMN goals.planned_break_until IS 'Date until which the planned break lasts';
COMMENT ON TABLE streak_recoveries IS 'Tracks when streak insurance was used to recover missed check-ins';