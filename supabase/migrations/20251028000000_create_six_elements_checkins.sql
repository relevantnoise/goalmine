-- Six Elements Check-in System
-- Created: October 28, 2025
-- Provides weekly check-in tracking for 6 Elements Framework

-- Create the check-in table for 6 Elements tracking
CREATE TABLE IF NOT EXISTS public.six_elements_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES public.six_elements_frameworks(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  week_date DATE NOT NULL, -- Monday of the week
  element_name TEXT NOT NULL CHECK (element_name IN ('Work', 'Sleep', 'Friends & Family', 'Health & Fitness', 'Personal Development', 'Spiritual')),
  
  -- Time tracking for this week
  planned_hours DECIMAL(4,1) NOT NULL DEFAULT 0, -- From user's ideal allocation
  actual_hours DECIMAL(4,1) NOT NULL DEFAULT 0, -- What they actually spent
  
  -- Satisfaction and notes
  satisfaction_level INTEGER CHECK (satisfaction_level >= 1 AND satisfaction_level <= 10),
  reflection_notes TEXT,
  
  -- Progress tracking
  progress_status TEXT CHECK (progress_status IN ('on_track', 'behind', 'ahead', 'need_adjustment')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one check-in per element per week
  UNIQUE(framework_id, week_date, element_name)
);

-- Weekly summary table for overall framework progress
CREATE TABLE IF NOT EXISTS public.six_elements_weekly_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES public.six_elements_frameworks(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  week_date DATE NOT NULL, -- Monday of the week
  
  -- Overall week assessment
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
  biggest_win TEXT,
  biggest_challenge TEXT,
  next_week_focus TEXT,
  
  -- Calculated metrics
  total_planned_hours DECIMAL(5,1) DEFAULT 0,
  total_actual_hours DECIMAL(5,1) DEFAULT 0,
  overall_balance_score DECIMAL(3,1) DEFAULT 0, -- 0-10 based on how close actual vs planned
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One summary per week
  UNIQUE(framework_id, week_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_six_elements_checkins_framework_id ON six_elements_checkins(framework_id);
CREATE INDEX IF NOT EXISTS idx_six_elements_checkins_week_date ON six_elements_checkins(week_date);
CREATE INDEX IF NOT EXISTS idx_six_elements_checkins_user_email ON six_elements_checkins(user_email);

CREATE INDEX IF NOT EXISTS idx_six_elements_weekly_summary_framework_id ON six_elements_weekly_summary(framework_id);
CREATE INDEX IF NOT EXISTS idx_six_elements_weekly_summary_week_date ON six_elements_weekly_summary(week_date);
CREATE INDEX IF NOT EXISTS idx_six_elements_weekly_summary_user_email ON six_elements_weekly_summary(user_email);

-- Enable RLS
ALTER TABLE six_elements_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE six_elements_weekly_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow service role full access for edge functions)
CREATE POLICY "Allow service role full access" ON six_elements_checkins FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON six_elements_weekly_summary FOR ALL USING (true);

-- Helper function to get Monday of current week
CREATE OR REPLACE FUNCTION get_current_week_monday()
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT (CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 1))::DATE;
$$;

-- Function to calculate balance score for a week
CREATE OR REPLACE FUNCTION calculate_weekly_balance_score(framework_id_param UUID, week_date_param DATE)
RETURNS DECIMAL(3,1)
LANGUAGE plpgsql
AS $$
DECLARE
  balance_score DECIMAL(3,1) := 0;
  element_count INTEGER := 0;
  element_record RECORD;
BEGIN
  -- Calculate balance score based on how close actual hours are to planned hours
  FOR element_record IN 
    SELECT 
      planned_hours,
      actual_hours,
      CASE 
        WHEN planned_hours = 0 THEN 10 -- If no time planned, perfect score if no time spent
        ELSE GREATEST(0, 10 - ABS(planned_hours - actual_hours)) -- Penalty for deviation
      END as element_score
    FROM six_elements_checkins 
    WHERE framework_id = framework_id_param 
      AND week_date = week_date_param
  LOOP
    balance_score := balance_score + element_record.element_score;
    element_count := element_count + 1;
  END LOOP;
  
  -- Return average score across all elements
  IF element_count > 0 THEN
    RETURN ROUND(balance_score / element_count, 1);
  ELSE
    RETURN 0;
  END IF;
END;
$$;