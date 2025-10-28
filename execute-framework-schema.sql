-- Simple 6 Elements Framework Tables
-- Execute this directly in Supabase SQL Editor

-- 1. Core framework instances
CREATE TABLE IF NOT EXISTS user_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  last_checkin_date DATE,
  total_checkins INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_frameworks_user_id ON user_frameworks(user_id);

-- 2. Individual element assessments
CREATE TABLE IF NOT EXISTS framework_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  element_name TEXT NOT NULL CHECK (element_name IN ('Work', 'Sleep', 'Friends & Family', 'Health & Fitness', 'Personal Development', 'Spiritual')),
  current_state INTEGER CHECK (current_state >= 1 AND current_state <= 10),
  desired_state INTEGER CHECK (desired_state >= 1 AND desired_state <= 10),
  personal_definition TEXT,
  weekly_hours INTEGER DEFAULT 0 CHECK (weekly_hours >= 0 AND weekly_hours <= 168),
  priority_level INTEGER DEFAULT 3 CHECK (priority_level >= 1 AND priority_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(framework_id, element_name)
);

CREATE INDEX IF NOT EXISTS idx_framework_elements_framework_id ON framework_elements(framework_id);

-- 3. Work happiness assessment
CREATE TABLE IF NOT EXISTS work_happiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  impact_current INTEGER CHECK (impact_current >= 1 AND impact_current <= 10),
  impact_desired INTEGER CHECK (impact_desired >= 1 AND impact_desired <= 10),
  fun_current INTEGER CHECK (fun_current >= 1 AND fun_current <= 10),
  fun_desired INTEGER CHECK (fun_desired >= 1 AND fun_desired <= 10),
  money_current INTEGER CHECK (money_current >= 1 AND money_current <= 10),
  money_desired INTEGER CHECK (money_desired >= 1 AND money_desired <= 10),
  remote_current INTEGER CHECK (remote_current >= 1 AND remote_current <= 10),
  remote_desired INTEGER CHECK (remote_desired >= 1 AND remote_desired <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(framework_id)
);

-- 4. Weekly check-ins
CREATE TABLE IF NOT EXISTS weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  week_ending DATE NOT NULL,
  element_scores JSONB NOT NULL DEFAULT '{}',
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(framework_id, week_ending)
);

-- 5. AI insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('gap_analysis', 'goal_suggestion', 'trend_alert', 'celebration')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3),
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Success message
SELECT 'Framework tables created successfully!' AS status;