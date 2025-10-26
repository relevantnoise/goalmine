-- Create simplified circle framework tables
-- This script will be executed on the remote Supabase database

-- 1. User Circle Frameworks table (main framework instance)
CREATE TABLE IF NOT EXISTS user_circle_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  work_hours_per_week INTEGER NOT NULL DEFAULT 40,
  sleep_hours_per_night DECIMAL(3,1) NOT NULL DEFAULT 8.0,
  commute_hours_per_week INTEGER NOT NULL DEFAULT 5,
  available_hours_per_week INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Circle Time Allocations table (per-circle data)
CREATE TABLE IF NOT EXISTS circle_time_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_circle_frameworks(id) ON DELETE CASCADE,
  circle_name TEXT NOT NULL CHECK (circle_name IN ('Spiritual', 'Friends & Family', 'Work', 'Personal Development', 'Health & Fitness')),
  importance_level INTEGER NOT NULL CHECK (importance_level >= 1 AND importance_level <= 10) DEFAULT 5,
  current_hours_per_week DECIMAL(4,1) NOT NULL DEFAULT 0,
  ideal_hours_per_week DECIMAL(4,1) NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Work Happiness Metrics table (Business Happiness Formula)
CREATE TABLE IF NOT EXISTS work_happiness_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_circle_frameworks(id) ON DELETE CASCADE,
  impact_current INTEGER NOT NULL CHECK (impact_current >= 1 AND impact_current <= 10) DEFAULT 5,
  impact_desired INTEGER NOT NULL CHECK (impact_desired >= 1 AND impact_desired <= 10) DEFAULT 8,
  fun_current INTEGER NOT NULL CHECK (fun_current >= 1 AND fun_current <= 10) DEFAULT 5,
  fun_desired INTEGER NOT NULL CHECK (fun_desired >= 1 AND fun_desired <= 10) DEFAULT 8,
  money_current INTEGER NOT NULL CHECK (money_current >= 1 AND money_current <= 10) DEFAULT 5,
  money_desired INTEGER NOT NULL CHECK (money_desired >= 1 AND money_desired <= 10) DEFAULT 8,
  remote_current INTEGER NOT NULL CHECK (remote_current >= 1 AND remote_current <= 10) DEFAULT 5,
  remote_desired INTEGER NOT NULL CHECK (remote_desired >= 1 AND remote_desired <= 10) DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Circle Check-ins table (for future weekly progress tracking)
CREATE TABLE IF NOT EXISTS circle_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_circle_frameworks(id) ON DELETE CASCADE,
  week_date DATE NOT NULL,
  circle_name TEXT NOT NULL CHECK (circle_name IN ('Spiritual', 'Friends & Family', 'Work', 'Personal Development', 'Health & Fitness')),
  actual_hours_spent DECIMAL(4,1) NOT NULL DEFAULT 0,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_circle_frameworks_user_email ON user_circle_frameworks(user_email);
CREATE INDEX IF NOT EXISTS idx_circle_time_allocations_framework_id ON circle_time_allocations(framework_id);
CREATE INDEX IF NOT EXISTS idx_work_happiness_metrics_framework_id ON work_happiness_metrics(framework_id);
CREATE INDEX IF NOT EXISTS idx_circle_checkins_framework_id ON circle_checkins(framework_id);
CREATE INDEX IF NOT EXISTS idx_circle_checkins_week_date ON circle_checkins(week_date);

-- Enable RLS (Row Level Security)
ALTER TABLE user_circle_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_time_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_happiness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow service role to bypass for edge functions)
CREATE POLICY "Allow service role full access" ON user_circle_frameworks FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON circle_time_allocations FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON work_happiness_metrics FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON circle_checkins FOR ALL USING (true);

-- Update goals table to support circle assignment (if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'circle_type') THEN
        ALTER TABLE goals ADD COLUMN circle_type TEXT;
        ALTER TABLE goals ADD CONSTRAINT valid_circle_type 
          CHECK (circle_type IN ('Spiritual', 'Friends & Family', 'Work', 'Personal Development', 'Health & Fitness'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'weekly_commitment_hours') THEN
        ALTER TABLE goals ADD COLUMN weekly_commitment_hours INTEGER;
    END IF;
END $$;