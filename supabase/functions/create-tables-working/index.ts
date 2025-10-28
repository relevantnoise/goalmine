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
    console.log('[CREATE-TABLES] Starting table creation process');
    
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

    console.log('[CREATE-TABLES] Creating tables using working method...');

    // Method 1: Try using the raw connection approach
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Create user_circle_frameworks table
        CREATE TABLE IF NOT EXISTS public.user_circle_frameworks (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_email TEXT NOT NULL,
            work_hours_per_week INTEGER NOT NULL DEFAULT 40,
            sleep_hours_per_night DECIMAL(3,1) NOT NULL DEFAULT 8.0,
            commute_hours_per_week INTEGER NOT NULL DEFAULT 5,
            available_hours_per_week INTEGER NOT NULL DEFAULT 115,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create circle_time_allocations table
        CREATE TABLE IF NOT EXISTS public.circle_time_allocations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            framework_id UUID NOT NULL REFERENCES public.user_circle_frameworks(id) ON DELETE CASCADE,
            circle_name TEXT NOT NULL,
            importance_level INTEGER NOT NULL CHECK (importance_level >= 1 AND importance_level <= 10) DEFAULT 5,
            current_hours_per_week INTEGER NOT NULL DEFAULT 0,
            ideal_hours_per_week INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create work_happiness_metrics table
        CREATE TABLE IF NOT EXISTS public.work_happiness_metrics (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            framework_id UUID NOT NULL REFERENCES public.user_circle_frameworks(id) ON DELETE CASCADE,
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

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_user_circle_frameworks_email ON public.user_circle_frameworks(user_email);
        CREATE INDEX IF NOT EXISTS idx_circle_allocations_framework ON public.circle_time_allocations(framework_id);
        CREATE INDEX IF NOT EXISTS idx_work_happiness_framework ON public.work_happiness_metrics(framework_id);
      `
    });

    if (error) {
      // exec_sql doesn't exist, try alternative method
      console.log('[CREATE-TABLES] exec_sql failed, trying manual creation...');
      
      // Try creating a simple test table first to verify our approach works
      const { error: testError } = await supabaseAdmin
        .from('user_circle_frameworks')
        .select('*')
        .limit(1);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cannot create tables - exec_sql function not available',
          details: 'Need database admin access to create tables',
          method_tried: 'rpc_exec_sql'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('✅ Tables created successfully via exec_sql');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tables created successfully',
        method: 'rpc_exec_sql'
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
        details: 'Table creation failed completely'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})