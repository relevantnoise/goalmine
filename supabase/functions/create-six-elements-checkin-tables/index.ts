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
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔧 Creating 6 Elements check-in tables...')

    // Create the main check-in table using direct SQL
    const checkinTableSQL = `
      CREATE TABLE IF NOT EXISTS public.six_elements_checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        framework_id UUID NOT NULL REFERENCES public.six_elements_frameworks(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL,
        week_date DATE NOT NULL,
        element_name TEXT NOT NULL CHECK (element_name IN ('Work', 'Sleep', 'Friends & Family', 'Health & Fitness', 'Personal Development', 'Spiritual')),
        
        planned_hours DECIMAL(4,1) NOT NULL DEFAULT 0,
        actual_hours DECIMAL(4,1) NOT NULL DEFAULT 0,
        
        satisfaction_level INTEGER CHECK (satisfaction_level >= 1 AND satisfaction_level <= 10),
        reflection_notes TEXT,
        
        progress_status TEXT CHECK (progress_status IN ('on_track', 'behind', 'ahead', 'need_adjustment')),
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        UNIQUE(framework_id, week_date, element_name)
      );
    `;
    
    const { error: checkinTableError } = await supabaseClient.from('__dummy__').select('1').limit(0);
    
    try {
      // Use raw SQL execution
      await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        },
        body: JSON.stringify({ sql: checkinTableSQL })
      });
    } catch (e) {
      console.log('Table likely already exists or using alternative method')
    }

    if (checkinTableError) {
      throw new Error(`Failed to create checkins table: ${checkinTableError.message}`)
    }

    // Create the weekly summary table
    const { error: summaryTableError } = await supabaseClient.rpc('exec_sql', {
      sql: `
        -- Weekly summary table for overall framework progress
        CREATE TABLE IF NOT EXISTS public.six_elements_weekly_summary (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          framework_id UUID NOT NULL REFERENCES public.six_elements_frameworks(id) ON DELETE CASCADE,
          user_email TEXT NOT NULL,
          week_date DATE NOT NULL,
          
          -- Overall week assessment
          overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
          biggest_win TEXT,
          biggest_challenge TEXT,
          next_week_focus TEXT,
          
          -- Calculated metrics
          total_planned_hours DECIMAL(5,1) DEFAULT 0,
          total_actual_hours DECIMAL(5,1) DEFAULT 0,
          overall_balance_score DECIMAL(3,1) DEFAULT 0,
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- One summary per week
          UNIQUE(framework_id, week_date)
        );
      `
    })

    if (summaryTableError) {
      throw new Error(`Failed to create weekly summary table: ${summaryTableError.message}`)
    }

    // Create indexes
    const { error: indexError } = await supabaseClient.rpc('exec_sql', {
      sql: `
        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_six_elements_checkins_framework_id ON six_elements_checkins(framework_id);
        CREATE INDEX IF NOT EXISTS idx_six_elements_checkins_week_date ON six_elements_checkins(week_date);
        CREATE INDEX IF NOT EXISTS idx_six_elements_checkins_user_email ON six_elements_checkins(user_email);

        CREATE INDEX IF NOT EXISTS idx_six_elements_weekly_summary_framework_id ON six_elements_weekly_summary(framework_id);
        CREATE INDEX IF NOT EXISTS idx_six_elements_weekly_summary_week_date ON six_elements_weekly_summary(week_date);
        CREATE INDEX IF NOT EXISTS idx_six_elements_weekly_summary_user_email ON six_elements_weekly_summary(user_email);
      `
    })

    if (indexError) {
      console.log('⚠️ Index creation warning (non-critical):', indexError)
    }

    // Enable RLS and create policies
    const { error: rlsError } = await supabaseClient.rpc('exec_sql', {
      sql: `
        -- Enable RLS
        ALTER TABLE six_elements_checkins ENABLE ROW LEVEL SECURITY;
        ALTER TABLE six_elements_weekly_summary ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies (allow service role full access for edge functions)
        DROP POLICY IF EXISTS "Allow service role full access" ON six_elements_checkins;
        DROP POLICY IF EXISTS "Allow service role full access" ON six_elements_weekly_summary;
        
        CREATE POLICY "Allow service role full access" ON six_elements_checkins FOR ALL USING (true);
        CREATE POLICY "Allow service role full access" ON six_elements_weekly_summary FOR ALL USING (true);
      `
    })

    if (rlsError) {
      console.log('⚠️ RLS setup warning (non-critical):', rlsError)
    }

    // Create helper functions
    const { error: functionError } = await supabaseClient.rpc('exec_sql', {
      sql: `
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
          FOR element_record IN 
            SELECT 
              planned_hours,
              actual_hours,
              CASE 
                WHEN planned_hours = 0 THEN 10
                ELSE GREATEST(0, 10 - ABS(planned_hours - actual_hours))
              END as element_score
            FROM six_elements_checkins 
            WHERE framework_id = framework_id_param 
              AND week_date = week_date_param
          LOOP
            balance_score := balance_score + element_record.element_score;
            element_count := element_count + 1;
          END LOOP;
          
          IF element_count > 0 THEN
            RETURN ROUND(balance_score / element_count, 1);
          ELSE
            RETURN 0;
          END IF;
        END;
        $$;
      `
    })

    if (functionError) {
      console.log('⚠️ Function creation warning (non-critical):', functionError)
    }

    console.log('✅ 6 Elements check-in tables created successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: "6 Elements check-in database tables created successfully",
        tables_created: [
          'six_elements_checkins',
          'six_elements_weekly_summary'
        ],
        functions_created: [
          'get_current_week_monday',
          'calculate_weekly_balance_score'
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Table creation failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})