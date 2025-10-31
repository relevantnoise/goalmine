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
    console.log('[TEST-DAN-AI] Testing AI insights generation for danlynn@gmail.com');

    // First, check what framework data exists
    const { data: frameworks, error: frameworkError } = await supabase
      .from('user_frameworks')
      .select('*')
      .eq('user_email', 'danlynn@gmail.com');

    console.log('[TEST-DAN-AI] Found frameworks:', frameworks?.length || 0);
    if (frameworks && frameworks.length > 0) {
      console.log('[TEST-DAN-AI] Framework data:', frameworks[0]);
      
      // Try to generate AI insights using the framework ID
      const frameworkId = frameworks[0].id;
      console.log('[TEST-DAN-AI] Using framework ID:', frameworkId);
      
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('generate-ai-insights', {
        body: {
          userEmail: 'danlynn@gmail.com',
          frameworkId: frameworkId
        }
      });
      
      console.log('[TEST-DAN-AI] AI generation result:', aiResult);
      if (aiError) {
        console.error('[TEST-DAN-AI] AI generation error:', aiError);
      }
      
      return new Response(JSON.stringify({
        success: true,
        frameworksFound: frameworks.length,
        framework: frameworks[0],
        aiResult: aiResult,
        aiError: aiError
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    } else {
      console.log('[TEST-DAN-AI] No frameworks found for danlynn@gmail.com');
      return new Response(JSON.stringify({
        success: false,
        message: 'No frameworks found for danlynn@gmail.com',
        frameworkError: frameworkError
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

  } catch (error: any) {
    console.error('[TEST-DAN-AI] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);