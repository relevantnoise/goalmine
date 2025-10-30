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
    console.log('[DEBUG-TABLES] Checking available tables and their schemas');

    // Check what tables exist that might contain AI insights
    const tables = ['ai_insights', 'insights', 'framework_insights', 'user_insights'];
    const results = {};

    for (const tableName of tables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1);
        
        results[tableName] = {
          exists: !error,
          error: error?.message || null,
          count,
          sampleData: data?.[0] || null
        };
      } catch (e) {
        results[tableName] = {
          exists: false,
          error: e.message,
          count: 0,
          sampleData: null
        };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Table diagnostic complete',
      tables: results,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DEBUG-TABLES] Error:', error);
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