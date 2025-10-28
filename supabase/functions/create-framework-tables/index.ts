import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🏗️ Creating 6 Elements Framework database tables...')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Test connection first
    console.log('🔗 Testing database connection...')
    const { data: testData, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError)
      throw new Error('Database connection failed')
    }
    console.log('✅ Database connection successful')

    // Since exec_sql might not be available, let's try a simpler approach
    // We'll create the tables using individual operations

    console.log('📋 Creating framework tables using direct queries...')

    // Since we can't use exec_sql, let's provide the SQL for manual execution
    const sqlScript = `
-- 🏗️ 6 Elements Framework Database Tables
-- Execute this SQL in your Supabase SQL Editor

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

-- Indexes for user_frameworks
CREATE INDEX IF NOT EXISTS idx_user_frameworks_user_id ON user_frameworks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_frameworks_active ON user_frameworks(user_id, is_active);

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

-- Indexes for framework_elements
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

-- Index for work_happiness
CREATE INDEX IF NOT EXISTS idx_work_happiness_framework_id ON work_happiness(framework_id);

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

-- Indexes for weekly_checkins
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_framework_id ON weekly_checkins(framework_id);

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

-- Index for ai_insights
CREATE INDEX IF NOT EXISTS idx_ai_insights_framework_id ON ai_insights(framework_id);
    `

    const result = {
      success: true,
      message: '6 Elements Framework SQL script ready for execution',
      instructions: 'Copy the SQL script below and execute it in your Supabase SQL Editor',
      sql_script: sqlScript,
      tables_to_create: [
        'user_frameworks',
        'framework_elements', 
        'work_happiness',
        'weekly_checkins',
        'ai_insights'
      ],
      next_steps: [
        '1. Copy the SQL script from this response',
        '2. Go to Supabase Dashboard > SQL Editor',
        '3. Paste and execute the script',
        '4. Verify tables were created successfully'
      ],
      timestamp: new Date().toISOString()
    }

    console.log('📋 Framework tables SQL script prepared')

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('🚨 Error preparing framework tables:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: 'Failed to prepare 6 Elements Framework database tables',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})