import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔧 Setting up simplified circle framework database tables...')

    const results = []

    // 1. Create user_circle_frameworks table
    try {
      await supabaseClient.from('user_circle_frameworks').select('id').limit(1)
      console.log('✅ user_circle_frameworks table already exists')
      results.push({ table: 'user_circle_frameworks', status: 'exists' })
    } catch (error) {
      console.log('📝 Creating user_circle_frameworks table...')
      // Table doesn't exist, we'll note this but can't create it via edge function
      results.push({ table: 'user_circle_frameworks', status: 'needs_creation' })
    }

    // 2. Create circle_time_allocations table
    try {
      await supabaseClient.from('circle_time_allocations').select('id').limit(1)
      console.log('✅ circle_time_allocations table already exists')
      results.push({ table: 'circle_time_allocations', status: 'exists' })
    } catch (error) {
      console.log('📝 circle_time_allocations table needs creation...')
      results.push({ table: 'circle_time_allocations', status: 'needs_creation' })
    }

    // 3. Create work_happiness_metrics table
    try {
      await supabaseClient.from('work_happiness_metrics').select('id').limit(1)
      console.log('✅ work_happiness_metrics table already exists')
      results.push({ table: 'work_happiness_metrics', status: 'exists' })
    } catch (error) {
      console.log('📝 work_happiness_metrics table needs creation...')
      results.push({ table: 'work_happiness_metrics', status: 'needs_creation' })
    }

    // 4. Create circle_checkins table
    try {
      await supabaseClient.from('circle_checkins').select('id').limit(1)
      console.log('✅ circle_checkins table already exists')
      results.push({ table: 'circle_checkins', status: 'exists' })
    } catch (error) {
      console.log('📝 circle_checkins table needs creation...')
      results.push({ table: 'circle_checkins', status: 'needs_creation' })
    }

    // 5. Check goals table for circle columns
    try {
      await supabaseClient.from('goals').select('circle_type').limit(1)
      console.log('✅ goals table circle_type column already exists')
      results.push({ table: 'goals_circle_type', status: 'exists' })
    } catch (error) {
      console.log('📝 goals table needs circle_type column...')
      results.push({ table: 'goals_circle_type', status: 'needs_creation' })
    }

    const needsCreation = results.filter(r => r.status === 'needs_creation')
    
    if (needsCreation.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Database tables need to be created manually',
          results: results,
          sql_to_run: `
-- Run this SQL in your Supabase SQL editor:

-- 1. User Circle Frameworks table
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

-- 2. Circle Time Allocations table
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

-- 3. Work Happiness Metrics table
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

-- 4. Circle Check-ins table
CREATE TABLE IF NOT EXISTS circle_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_circle_frameworks(id) ON DELETE CASCADE,
  week_date DATE NOT NULL,
  circle_name TEXT NOT NULL CHECK (circle_name IN ('Spiritual', 'Friends & Family', 'Work', 'Personal Development', 'Health & Fitness')),
  actual_hours_spent DECIMAL(4,1) NOT NULL DEFAULT 0,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add circle columns to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS circle_type TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS weekly_commitment_hours INTEGER;

-- Add constraint for valid circle types
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_circle_type' AND table_name = 'goals'
    ) THEN
        ALTER TABLE goals ADD CONSTRAINT valid_circle_type 
          CHECK (circle_type IN ('Spiritual', 'Friends & Family', 'Work', 'Personal Development', 'Health & Fitness'));
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_circle_frameworks_user_email ON user_circle_frameworks(user_email);
CREATE INDEX IF NOT EXISTS idx_circle_time_allocations_framework_id ON circle_time_allocations(framework_id);
CREATE INDEX IF NOT EXISTS idx_work_happiness_metrics_framework_id ON work_happiness_metrics(framework_id);
CREATE INDEX IF NOT EXISTS idx_circle_checkins_framework_id ON circle_checkins(framework_id);

-- Enable RLS
ALTER TABLE user_circle_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_time_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_happiness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Allow service role full access" ON user_circle_frameworks FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow service role full access" ON circle_time_allocations FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow service role full access" ON work_happiness_metrics FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow service role full access" ON circle_checkins FOR ALL USING (true);
`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    console.log('🎯 All tables already exist!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All circle framework tables already exist',
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})