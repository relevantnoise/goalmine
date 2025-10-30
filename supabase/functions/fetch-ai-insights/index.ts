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
    const { userEmail } = await req.json();
    
    if (!userEmail) {
      throw new Error('Missing required field: userEmail');
    }

    console.log('[FETCH-AI-INSIGHTS] Fetching insights for user:', userEmail);

    // Get user's framework to get framework_id
    const { data: frameworkResponse } = await supabase.functions.invoke('fetch-framework-data', {
      body: { userEmail }
    });

    if (!frameworkResponse?.hasFramework || !frameworkResponse?.data?.framework) {
      return new Response(JSON.stringify({
        success: true,
        insights: [],
        hasInsights: false,
        message: 'No framework found - no insights available'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const framework = frameworkResponse.data.framework;

    // Fetch existing insights from database
    const { data: insights, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('framework_id', framework.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[FETCH-AI-INSIGHTS] Database error:', error);
      throw new Error(`Failed to fetch insights: ${error.message}`);
    }

    console.log('[FETCH-AI-INSIGHTS] Found', insights?.length || 0, 'insights');

    return new Response(JSON.stringify({
      success: true,
      insights: insights || [],
      hasInsights: (insights?.length || 0) > 0,
      frameworkId: framework.id,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[FETCH-AI-INSIGHTS] Error:', error);
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