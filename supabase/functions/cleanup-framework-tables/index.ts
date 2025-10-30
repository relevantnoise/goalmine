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

    console.log('[CLEANUP] Starting framework table cleanup...');

    // Drop all old framework tables
    const cleanupSQL = `
-- 🧹 CLEANUP: Remove all old framework tables
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS weekly_checkins CASCADE;
DROP TABLE IF EXISTS work_happiness CASCADE;
DROP TABLE IF EXISTS framework_elements CASCADE;
DROP TABLE IF EXISTS six_elements CASCADE;
DROP TABLE IF EXISTS user_frameworks CASCADE;
DROP TABLE IF EXISTS six_elements_frameworks CASCADE;
DROP TABLE IF EXISTS user_circle_frameworks CASCADE;
DROP TABLE IF EXISTS circle_frameworks CASCADE;
DROP TABLE IF EXISTS circle_profiles CASCADE;
DROP TABLE IF EXISTS circle_specific_data CASCADE;
DROP TABLE IF EXISTS weekly_circle_plans CASCADE;

-- 🏗️ CREATE: Clean 6 Pillars Framework schema
CREATE TABLE user_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  last_checkin_date DATE,
  total_checkins INTEGER DEFAULT 0
);

CREATE INDEX idx_user_frameworks_user_id ON user_frameworks(user_id);
CREATE INDEX idx_user_frameworks_active ON user_frameworks(user_id, is_active);

CREATE TABLE framework_elements (
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

CREATE INDEX idx_framework_elements_framework_id ON framework_elements(framework_id);

CREATE TABLE work_happiness (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  week_date DATE NOT NULL,
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
  element_scores JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_weekly_checkins_framework_id ON weekly_checkins(framework_id);
CREATE INDEX idx_weekly_checkins_date ON weekly_checkins(week_date);

CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_framework_id ON ai_insights(framework_id);
CREATE INDEX idx_ai_insights_unread ON ai_insights(framework_id, is_read);
`;

    console.log('[CLEANUP] Executing cleanup and recreation SQL...');
    
    const { error: sqlError } = await supabase.rpc('exec_sql', { 
      sql_query: cleanupSQL 
    });

    if (sqlError) {
      console.error('[CLEANUP] SQL execution failed:', sqlError);
      
      // Try direct SQL execution as fallback
      const { error: directError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);
      
      if (directError) {
        throw new Error(`Database access failed: ${directError.message}`);
      }
      
      throw new Error(`SQL execution failed: ${sqlError.message}`);
    }

    console.log('[CLEANUP] ✅ Framework tables cleaned and recreated successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Framework tables cleaned and recreated successfully',
      tables_created: [
        'user_frameworks',
        'framework_elements', 
        'work_happiness',
        'weekly_checkins',
        'ai_insights'
      ]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[CLEANUP] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});