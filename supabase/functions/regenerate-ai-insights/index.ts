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

    console.log('[REGENERATE-AI-INSIGHTS] Clearing existing insights and generating new strategic analysis for:', userEmail);

    // Get user's framework to get framework_id
    const { data: frameworkResponse } = await supabase.functions.invoke('fetch-framework-data', {
      body: { userEmail }
    });

    if (!frameworkResponse?.hasFramework || !frameworkResponse?.data?.framework) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No framework found for user'
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const framework = frameworkResponse.data.framework;

    // Clear existing insights
    console.log('[REGENERATE-AI-INSIGHTS] Clearing existing insights...');
    const { error: deleteError } = await supabase
      .from('ai_insights')
      .delete()
      .eq('framework_id', framework.id);

    if (deleteError) {
      console.error('[REGENERATE-AI-INSIGHTS] Error clearing insights:', deleteError);
    } else {
      console.log('[REGENERATE-AI-INSIGHTS] Successfully cleared existing insights');
    }

    // Generate new strategic insights
    console.log('[REGENERATE-AI-INSIGHTS] Generating new strategic insights...');
    const { data: generateData, error: generateError } = await supabase.functions.invoke('generate-ai-direct-return', {
      body: { 
        userEmail: userEmail
      }
    });

    if (generateError) {
      console.error('[REGENERATE-AI-INSIGHTS] Error generating insights:', generateError);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to generate insights: ${generateError.message}`
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log('[REGENERATE-AI-INSIGHTS] Successfully regenerated strategic insights');

    return new Response(JSON.stringify({
      success: true,
      message: 'Strategic insights regenerated successfully with Dan Lynn prompt',
      insights: generateData?.insights || [],
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[REGENERATE-AI-INSIGHTS] Error:', error);
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