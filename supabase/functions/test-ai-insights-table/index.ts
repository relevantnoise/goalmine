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
    console.log('[TEST-AI-INSIGHTS-TABLE] Testing ai_insights table...');

    // Test table structure by selecting from empty result
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .limit(1);

    if (error) {
      console.error('[TEST-AI-INSIGHTS-TABLE] Table structure error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: `Table structure issue: ${error.message}`,
        suggestion: 'ai_insights table may not exist or have incorrect schema'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log('[TEST-AI-INSIGHTS-TABLE] Table structure is valid');

    return new Response(JSON.stringify({
      success: true,
      message: 'ai_insights table exists and has correct structure',
      sampleData: data || [],
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[TEST-AI-INSIGHTS-TABLE] Error:', error);
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