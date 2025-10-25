-- 5 Circle Framework Database Migration
-- Created: October 25, 2025
-- Purpose: Add comprehensive 5 Circle life management system for Pro Plan users

-- Circle Framework Profile (main framework data)
CREATE TABLE circle_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Life Context
  life_stage TEXT CHECK (life_stage IN ('early_career', 'mid_career_family', 'leadership_scaling', 'transition_change')),
  primary_challenge TEXT,
  primary_90_day_priority TEXT,
  
  -- Time Architecture
  total_available_hours_per_week INTEGER,
  work_hours_per_week INTEGER,
  sleep_hours_per_night DECIMAL(3,1),
  commute_hours_per_week INTEGER,
  
  -- Framework Preferences
  circle_priority_ranking JSONB, -- Array of circle names in priority order
  biggest_concern TEXT CHECK (biggest_concern IN ('not_enough_time', 'lack_discipline', 'competing_priorities', 'energy_management', 'staying_consistent')),
  tracking_preference TEXT CHECK (tracking_preference IN ('daily_checkins', 'weekly_reviews', 'simple_habits', 'detailed_metrics', 'minimal_tracking')),
  
  -- Optimization Insights
  identified_synergies TEXT[],
  identified_conflicts TEXT[],
  efficiency_opportunities TEXT[],
  
  -- Meta
  interview_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual Circle Profiles
CREATE TABLE circle_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID REFERENCES circle_frameworks(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Circle Identity
  circle_name TEXT CHECK (circle_name IN ('spiritual', 'friends_family', 'work', 'personal_development', 'health_fitness')),
  
  -- Personal Definition (CRITICAL)
  personal_definition TEXT,
  importance_level INTEGER CHECK (importance_level BETWEEN 1 AND 5),
  
  -- Current State Assessment
  current_satisfaction INTEGER CHECK (current_satisfaction BETWEEN 1 AND 10),
  current_time_per_week INTEGER,
  current_activities TEXT[],
  current_obstacles TEXT[],
  
  -- Ideal State Vision
  ideal_time_per_week INTEGER,
  success_definition_90_days TEXT,
  preferred_activities TEXT[],
  
  -- Integration Data
  best_time_of_day TEXT CHECK (best_time_of_day IN ('morning', 'afternoon', 'evening', 'flexible')),
  best_days_of_week TEXT[],
  synergy_opportunities TEXT[],
  constraint_conflicts TEXT[],
  
  -- Goal Architecture
  primary_goal TEXT,
  daily_practices TEXT[],
  weekly_practices TEXT[],
  monthly_milestones TEXT[],
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circle-Specific Additional Data
CREATE TABLE circle_specific_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_profile_id UUID REFERENCES circle_profiles(id) ON DELETE CASCADE,
  
  -- Spiritual Circle Specific
  spiritual_type TEXT CHECK (spiritual_type IN ('religious_practice', 'meditation_mindfulness', 'nature_solitude', 'personal_meaning', 'not_important', 'other')),
  specific_practices TEXT[],
  community_vs_solo TEXT CHECK (community_vs_solo IN ('community_focused', 'solo_focused', 'mixed')),
  
  -- Friends & Family Circle Specific
  relationship_priorities TEXT[],
  connection_style TEXT CHECK (connection_style IN ('quality_time', 'regular_checkins', 'activities_together', 'being_available')),
  relationship_needs_attention TEXT[],
  ideal_connection_frequency JSONB, -- {relationship_type: frequency}
  family_vs_friends_balance INTEGER CHECK (family_vs_friends_balance BETWEEN 0 AND 100),
  
  -- Work Circle Specific
  career_focus_area TEXT CHECK (career_focus_area IN ('performance_results', 'skills_learning', 'leadership_influence', 'work_life_boundaries')),
  work_type TEXT CHECK (work_type IN ('employee', 'manager', 'executive', 'entrepreneur', 'freelancer')),
  career_stage TEXT CHECK (career_stage IN ('climbing', 'excelling', 'leading', 'transitioning')),
  boundary_preferences TEXT[],
  productivity_patterns TEXT,
  
  -- Personal Development Circle Specific
  growth_type TEXT CHECK (growth_type IN ('skills_expertise', 'knowledge_learning', 'habits_discipline', 'self_awareness_mindset')),
  learning_style TEXT CHECK (learning_style IN ('reading', 'courses', 'experience', 'mentorship', 'mixed')),
  development_areas TEXT[],
  learning_schedule_preference TEXT CHECK (learning_schedule_preference IN ('daily_small', 'weekly_blocks', 'intensive_periods')),
  
  -- Health & Fitness Circle Specific
  fitness_style TEXT CHECK (fitness_style IN ('gym_structured', 'outdoor_activities', 'sports_recreation', 'nutrition_focus', 'minimal_efficient')),
  health_priorities TEXT[],
  activity_preferences TEXT[],
  schedule_flexibility TEXT CHECK (schedule_flexibility IN ('very_flexible', 'somewhat_flexible', 'needs_routine')),
  health_obstacles TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly Circle Plans & Reviews
CREATE TABLE weekly_circle_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID REFERENCES circle_frameworks(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  week_starting DATE,
  
  -- Planned vs Actual per Circle
  planned_data JSONB, -- {circle_name: {hours, activities, goals, scheduled_times}}
  actual_results JSONB, -- {circle_name: {actual_hours, completed_activities, satisfaction_rating, obstacles}}
  
  -- AI Recommendations for Next Week
  ai_recommendations JSONB, -- {time_adjustments, activity_suggestions, synergy_opportunities, efficiency_improvements}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add circle_type to existing goals table to link goals to circles
ALTER TABLE goals 
ADD COLUMN circle_type TEXT CHECK (circle_type IN ('spiritual', 'friends_family', 'work', 'personal_development', 'health_fitness')),
ADD COLUMN weekly_commitment_hours DECIMAL(4,1),
ADD COLUMN circle_interview_data JSONB; -- Store relevant interview insights for this goal

-- Create indexes for performance
CREATE INDEX idx_circle_frameworks_user_id ON circle_frameworks(user_id);
CREATE INDEX idx_circle_profiles_framework_id ON circle_profiles(framework_id);
CREATE INDEX idx_circle_profiles_circle_name ON circle_profiles(circle_name);
CREATE INDEX idx_weekly_circle_plans_user_week ON weekly_circle_plans(user_id, week_starting);
CREATE INDEX idx_goals_circle_type ON goals(circle_type);

-- RLS Policies for circle framework tables
ALTER TABLE circle_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_specific_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_circle_plans ENABLE ROW LEVEL SECURITY;

-- Circle frameworks - users can only access their own
CREATE POLICY "Users can manage their own circle frameworks" ON circle_frameworks
  FOR ALL USING (auth.uid()::text = user_id);

-- Circle profiles - users can only access their own
CREATE POLICY "Users can manage their own circle profiles" ON circle_profiles
  FOR ALL USING (auth.uid()::text = user_id);

-- Circle specific data - users can only access their own through circle_profiles
CREATE POLICY "Users can manage their own circle specific data" ON circle_specific_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM circle_profiles cp 
      WHERE cp.id = circle_specific_data.circle_profile_id 
      AND cp.user_id = auth.uid()::text
    )
  );

-- Weekly circle plans - users can only access their own
CREATE POLICY "Users can manage their own weekly circle plans" ON weekly_circle_plans
  FOR ALL USING (auth.uid()::text = user_id);

-- Update the goals RLS policy to handle circle_type (if needed)
-- Note: Existing RLS should already cover this, but we can add circle-specific policies later if needed

COMMENT ON TABLE circle_frameworks IS 'Main 5 Circle framework profile for Pro Plan users';
COMMENT ON TABLE circle_profiles IS 'Individual circle configurations and preferences';
COMMENT ON TABLE circle_specific_data IS 'Circle-specific additional data fields';
COMMENT ON TABLE weekly_circle_plans IS 'Weekly planning and review data for circle management';