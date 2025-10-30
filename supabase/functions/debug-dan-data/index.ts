import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[DEBUG-DAN] Starting debug for danlynn@gmail.com...');
    
    const userEmail = 'danlynn@gmail.com';
    
    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();
    
    console.log('[DEBUG-DAN] Profile:', profile);
    console.log('[DEBUG-DAN] Profile error:', profileError);
    
    // Check all potential framework tables
    const tables = ['user_frameworks', 'pillar_assessments', 'work_happiness', 'ai_insights'];
    const results: any = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(5);
        
        results[table] = {
          exists: !error,
          count: data?.length || 0,
          error: error?.message,
          sampleData: data?.[0] || null
        };
        
        console.log(`[DEBUG-DAN] Table ${table}:`, results[table]);
      } catch (err) {
        results[table] = {
          exists: false,
          error: (err as Error).message
        };
      }
    }
    
    // Look for Dan's data specifically in pillar_assessments
    let danPillars = null;
    try {
      const { data: pillarsData, error: pillarsError } = await supabase
        .from('pillar_assessments')
        .select('*')
        .limit(20);
      
      console.log('[DEBUG-DAN] All pillar assessments:', pillarsData);
      console.log('[DEBUG-DAN] Pillar assessments error:', pillarsError);
      
      danPillars = {
        total: pillarsData?.length || 0,
        data: pillarsData || [],
        error: pillarsError?.message
      };
    } catch (err) {
      danPillars = { error: (err as Error).message };
    }
    
    // Look for work happiness data
    let danWorkHappiness = null;
    try {
      const { data: workData, error: workError } = await supabase
        .from('work_happiness')
        .select('*')
        .limit(10);
      
      console.log('[DEBUG-DAN] All work happiness:', workData);
      
      danWorkHappiness = {
        total: workData?.length || 0,
        data: workData || [],
        error: workError?.message
      };
    } catch (err) {
      danWorkHappiness = { error: (err as Error).message };
    }

    return new Response(JSON.stringify({
      success: true,
      debug: {
        userEmail,
        profile,
        profileError: profileError?.message,
        tableResults: results,
        danPillars,
        danWorkHappiness,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DEBUG-DAN] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);