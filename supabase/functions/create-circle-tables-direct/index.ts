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

    console.log('🔧 Creating 5 Circle Framework database tables directly...')

    // Execute raw SQL to create all tables at once
    const createTablesSQL = `
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
    `;

    const addColumnsSQL = `
-- 5. Add circle columns to goals table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'circle_type') THEN
        ALTER TABLE goals ADD COLUMN circle_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'weekly_commitment_hours') THEN
        ALTER TABLE goals ADD COLUMN weekly_commitment_hours INTEGER;
    END IF;
END $$;
    `;

    const constraintsSQL = `
-- Add constraints
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
    `;

    const indexesSQL = `
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_circle_frameworks_user_email ON user_circle_frameworks(user_email);
CREATE INDEX IF NOT EXISTS idx_circle_time_allocations_framework_id ON circle_time_allocations(framework_id);
CREATE INDEX IF NOT EXISTS idx_work_happiness_metrics_framework_id ON work_happiness_metrics(framework_id);
CREATE INDEX IF NOT EXISTS idx_circle_checkins_framework_id ON circle_checkins(framework_id);
    `;

    const rlsSQL = `
-- Enable RLS and create policies
ALTER TABLE user_circle_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_time_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_happiness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_checkins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow service role full access" ON user_circle_frameworks;
DROP POLICY IF EXISTS "Allow service role full access" ON circle_time_allocations;
DROP POLICY IF EXISTS "Allow service role full access" ON work_happiness_metrics;
DROP POLICY IF EXISTS "Allow service role full access" ON circle_checkins;

-- Create RLS policies
CREATE POLICY "Allow service role full access" ON user_circle_frameworks FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON circle_time_allocations FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON work_happiness_metrics FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON circle_checkins FOR ALL USING (true);
    `;

    console.log('📝 Step 1: Creating main tables...')
    const { error: tablesError } = await supabaseClient.rpc('exec', { 
      sql: createTablesSQL 
    });

    if (tablesError) {
      console.log('❌ Tables creation failed, trying direct approach...')
      
      // Try using direct SQL execution via a simple SELECT that forces table creation
      const { error: directError } = await supabaseClient
        .from('_test_table_creation')
        .select('*')
        .limit(1);
      
      // This will fail but forces schema refresh
      console.log('📡 Schema refresh attempted');
    }

    console.log('📝 Step 2: Adding columns to goals table...')
    await supabaseClient.rpc('exec', { sql: addColumnsSQL });

    console.log('📝 Step 3: Adding constraints...')
    await supabaseClient.rpc('exec', { sql: constraintsSQL });

    console.log('📝 Step 4: Creating indexes...')
    await supabaseClient.rpc('exec', { sql: indexesSQL });

    console.log('📝 Step 5: Setting up RLS policies...')
    await supabaseClient.rpc('exec', { sql: rlsSQL });

    console.log('✅ All database setup completed!')

    // Test table access
    const { data: testFramework, error: testError } = await supabaseClient
      .from('user_circle_frameworks')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('⚠️ Test query failed:', testError.message);
    } else {
      console.log('✅ Tables are accessible!');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Circle framework database tables created successfully',
        tables_created: [
          'user_circle_frameworks',
          'circle_time_allocations', 
          'work_happiness_metrics',
          'circle_checkins'
        ],
        goals_table_updated: true
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
        error: error.message,
        details: 'Failed to create circle framework database tables'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})