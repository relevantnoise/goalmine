import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CREATE-TABLES-NOW] Creating circle framework tables');
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables');
    }

    // Execute SQL directly via HTTP
    const sql = `
      -- Create main framework table
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

      -- Create circle allocations table
      CREATE TABLE IF NOT EXISTS public.circle_time_allocations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        framework_id UUID NOT NULL REFERENCES public.user_circle_frameworks(id) ON DELETE CASCADE,
        circle_name TEXT NOT NULL,
        importance_level INTEGER NOT NULL,
        current_hours_per_week INTEGER NOT NULL,
        ideal_hours_per_week INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create work happiness table
      CREATE TABLE IF NOT EXISTS public.work_happiness_metrics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        framework_id UUID NOT NULL REFERENCES public.user_circle_frameworks(id) ON DELETE CASCADE,
        impact_current INTEGER NOT NULL,
        impact_desired INTEGER NOT NULL,
        fun_current INTEGER NOT NULL,
        fun_desired INTEGER NOT NULL,
        money_current INTEGER NOT NULL,
        money_desired INTEGER NOT NULL,
        remote_current INTEGER NOT NULL,
        remote_desired INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('🔄 Executing SQL to create tables...');

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.text();
    console.log('📡 SQL Response:', result);

    if (!response.ok) {
      throw new Error(`SQL execution failed: ${result}`);
    }

    console.log('✅ Tables created successfully!');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Circle framework tables created!',
      sql_response: result
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});