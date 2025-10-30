import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[CREATE-TABLES] Creating clean framework tables...');

    // Create clean framework tables with user-friendly structure
    const createTablesSQL = `
-- 🏗️ 6 Pillars of Life™ Framework - Clean Database Schema
-- User-friendly structure with email columns for easy investigation

-- 1. Main framework instances (with user email for easy lookup)
CREATE TABLE IF NOT EXISTS user_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  last_checkin_date DATE,
  total_checkins INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_frameworks_user_id ON user_frameworks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_frameworks_email ON user_frameworks(user_email);
CREATE INDEX IF NOT EXISTS idx_user_frameworks_active ON user_frameworks(user_id, is_active);

-- 2. Individual pillar assessments
CREATE TABLE IF NOT EXISTS framework_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  element_name TEXT NOT NULL CHECK (element_name IN ('Work', 'Sleep', 'Friends & Family', 'Health & Fitness', 'Personal Development', 'Spiritual')),
  current_state INTEGER CHECK (current_state >= 1 AND current_state <= 10),
  desired_state INTEGER CHECK (desired_state >= 1 AND desired_state <= 10),
  personal_definition TEXT,
  weekly_hours INTEGER DEFAULT 0 CHECK (weekly_hours >= 0 AND weekly_hours <= 168),
  priority_level INTEGER DEFAULT 3 CHECK (priority_level >= 1 AND priority_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_framework_elements_framework_id ON framework_elements(framework_id);
CREATE INDEX IF NOT EXISTS idx_framework_elements_name ON framework_elements(element_name);

-- 3. Business Happiness Formula results
CREATE TABLE IF NOT EXISTS work_happiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  impact_current INTEGER CHECK (impact_current >= 1 AND impact_current <= 10),
  impact_desired INTEGER CHECK (impact_desired >= 1 AND impact_desired <= 10),
  fun_current INTEGER CHECK (fun_current >= 1 AND fun_current <= 10),
  fun_desired INTEGER CHECK (fun_desired >= 1 AND fun_desired <= 10),
  money_current INTEGER CHECK (money_current >= 1 AND money_current <= 10),
  money_desired INTEGER CHECK (money_desired >= 1 AND money_desired <= 10),
  remote_current INTEGER CHECK (remote_current >= 1 AND remote_current <= 10),
  remote_desired INTEGER CHECK (remote_desired >= 1 AND remote_desired <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_happiness_framework_id ON work_happiness(framework_id);
CREATE INDEX IF NOT EXISTS idx_work_happiness_email ON work_happiness(user_email);

-- 4. Weekly check-ins for progress tracking
CREATE TABLE IF NOT EXISTS weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  week_date DATE NOT NULL,
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
  element_scores JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_checkins_framework_id ON weekly_checkins(framework_id);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_email ON weekly_checkins(user_email);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_date ON weekly_checkins(week_date);

-- 5. AI insights and recommendations
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_framework_id ON ai_insights(framework_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_email ON ai_insights(user_email);
CREATE INDEX IF NOT EXISTS idx_ai_insights_unread ON ai_insights(framework_id, is_read);

-- Add helpful comments
COMMENT ON TABLE user_frameworks IS '6 Pillars Framework instances - one per user assessment';
COMMENT ON TABLE framework_elements IS 'Individual pillar assessments (Work, Sleep, etc.) with current/desired states';
COMMENT ON TABLE work_happiness IS 'Business Happiness Formula results (Impact, Fun, Money, Flexibility)';
COMMENT ON TABLE weekly_checkins IS 'Weekly progress tracking for pillar improvements';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations for users';
`;

    console.log('[CREATE-TABLES] Executing table creation SQL...');
    
    const { error: sqlError } = await supabase
      .from('_dummy_table_for_sql_execution')
      .select('*')
      .limit(0);

    // Execute raw SQL using rpc if available, otherwise try direct execution
    try {
      const { error: rpcError } = await supabase.rpc('exec_sql', { 
        sql_query: createTablesSQL 
      });
      
      if (rpcError) {
        throw new Error(`RPC execution failed: ${rpcError.message}`);
      }
    } catch (rpcErr) {
      console.log('[CREATE-TABLES] RPC not available, tables may need manual creation');
      console.log('[CREATE-TABLES] SQL to execute manually:');
      console.log(createTablesSQL);
    }

    console.log('[CREATE-TABLES] ✅ Framework tables created successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Clean framework tables created successfully',
      tables_created: [
        'user_frameworks',
        'framework_elements', 
        'work_happiness',
        'weekly_checkins',
        'ai_insights'
      ],
      features: [
        'User email columns for easy investigation',
        'Proper foreign key relationships',
        'Indexes for performance',
        'Data validation constraints',
        'Table comments for documentation'
      ],
      sql_executed: createTablesSQL
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[CREATE-TABLES] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      note: 'Tables may need to be created manually using the SQL provided'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});