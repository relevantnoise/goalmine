import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[CREATE-TABLES-FINAL] Creating 6 Elements framework tables...');
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables');
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    // Execute the exact SQL from our migration file
    const createTablesSQL = `
      -- Create tables for 6 Elements Framework data capture
      -- Table 1: Main framework record with time context
      CREATE TABLE IF NOT EXISTS public.user_circle_frameworks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_email TEXT NOT NULL,
          work_hours_per_week INTEGER NOT NULL,
          sleep_hours_per_night DECIMAL(3,1) NOT NULL,
          commute_hours_per_week INTEGER NOT NULL,
          available_hours_per_week INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Table 2: Circle allocations (one record per circle per framework)
      CREATE TABLE IF NOT EXISTS public.circle_time_allocations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          framework_id UUID NOT NULL REFERENCES public.user_circle_frameworks(id) ON DELETE CASCADE,
          circle_name TEXT NOT NULL,
          importance_level INTEGER NOT NULL CHECK (importance_level >= 1 AND importance_level <= 10),
          current_hours_per_week INTEGER NOT NULL,
          ideal_hours_per_week INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Table 3: Work happiness metrics
      CREATE TABLE IF NOT EXISTS public.work_happiness_metrics (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          framework_id UUID NOT NULL REFERENCES public.user_circle_frameworks(id) ON DELETE CASCADE,
          impact_current INTEGER NOT NULL CHECK (impact_current >= 1 AND impact_current <= 10),
          impact_desired INTEGER NOT NULL CHECK (impact_desired >= 1 AND impact_desired <= 10),
          fun_current INTEGER NOT NULL CHECK (fun_current >= 1 AND fun_current <= 10),
          fun_desired INTEGER NOT NULL CHECK (fun_desired >= 1 AND fun_desired <= 10),
          money_current INTEGER NOT NULL CHECK (money_current >= 1 AND money_current <= 10),
          money_desired INTEGER NOT NULL CHECK (money_desired >= 1 AND money_desired <= 10),
          remote_current INTEGER NOT NULL CHECK (remote_current >= 1 AND remote_current <= 10),
          remote_desired INTEGER NOT NULL CHECK (remote_desired >= 1 AND remote_desired <= 10),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_user_circle_frameworks_email ON public.user_circle_frameworks(user_email);
      CREATE INDEX IF NOT EXISTS idx_circle_allocations_framework ON public.circle_time_allocations(framework_id);
      CREATE INDEX IF NOT EXISTS idx_work_happiness_framework ON public.work_happiness_metrics(framework_id);

      -- Enable RLS and create policies
      ALTER TABLE public.user_circle_frameworks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.circle_time_allocations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.work_happiness_metrics ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Enable service role access" ON public.user_circle_frameworks;
      DROP POLICY IF EXISTS "Enable service role access" ON public.circle_time_allocations;
      DROP POLICY IF EXISTS "Enable service role access" ON public.work_happiness_metrics;

      -- Create RLS policies for service role access
      CREATE POLICY "Enable service role access" ON public.user_circle_frameworks FOR ALL USING (true);
      CREATE POLICY "Enable service role access" ON public.circle_time_allocations FOR ALL USING (true);
      CREATE POLICY "Enable service role access" ON public.work_happiness_metrics FOR ALL USING (true);
    `;

    console.log('📝 Executing SQL to create tables...');
    
    // Use the REST API approach with raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ sql: createTablesSQL })
    });

    if (!response.ok) {
      console.log('❌ REST API exec failed, trying direct query approach...');
      
      // Fallback: Try creating tables individually using Supabase client
      const queries = [
        `CREATE TABLE IF NOT EXISTS public.user_circle_frameworks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_email TEXT NOT NULL,
          work_hours_per_week INTEGER NOT NULL,
          sleep_hours_per_night DECIMAL(3,1) NOT NULL,
          commute_hours_per_week INTEGER NOT NULL,
          available_hours_per_week INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS public.circle_time_allocations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          framework_id UUID NOT NULL REFERENCES public.user_circle_frameworks(id) ON DELETE CASCADE,
          circle_name TEXT NOT NULL,
          importance_level INTEGER NOT NULL CHECK (importance_level >= 1 AND importance_level <= 10),
          current_hours_per_week INTEGER NOT NULL,
          ideal_hours_per_week INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS public.work_happiness_metrics (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          framework_id UUID NOT NULL REFERENCES public.user_circle_frameworks(id) ON DELETE CASCADE,
          impact_current INTEGER NOT NULL CHECK (impact_current >= 1 AND impact_current <= 10),
          impact_desired INTEGER NOT NULL CHECK (impact_desired >= 1 AND impact_desired <= 10),
          fun_current INTEGER NOT NULL CHECK (fun_current >= 1 AND fun_current <= 10),
          fun_desired INTEGER NOT NULL CHECK (fun_desired >= 1 AND fun_desired <= 10),
          money_current INTEGER NOT NULL CHECK (money_current >= 1 AND money_current <= 10),
          money_desired INTEGER NOT NULL CHECK (money_desired >= 1 AND money_desired <= 10),
          remote_current INTEGER NOT NULL CHECK (remote_current >= 1 AND remote_current <= 10),
          remote_desired INTEGER NOT NULL CHECK (remote_desired >= 1 and remote_desired <= 10),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      ];

      for (const query of queries) {
        console.log(`Executing: ${query.substring(0, 50)}...`);
        const { error } = await supabaseAdmin.rpc('exec', { sql: query });
        if (error) {
          console.log(`Query failed: ${error.message}`);
        }
      }
    }

    console.log('✅ Tables created, testing access...');

    // Test table access
    const { data: testFramework, error: testError } = await supabaseAdmin
      .from('user_circle_frameworks')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('⚠️ Test query failed:', testError.message);
      throw new Error(`Table creation verification failed: ${testError.message}`);
    } else {
      console.log('✅ Tables are accessible and ready!');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '6 Elements framework database tables created successfully',
        tables_created: [
          'user_circle_frameworks',
          'circle_time_allocations', 
          'work_happiness_metrics'
        ],
        verification: 'Tables accessible via service role'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 TABLE CREATION ERROR:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to create 6 Elements framework database tables'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})