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
    console.log('[GENERATE-DAN-AI] Manually generating AI insights for danlynn@gmail.com...');

    // Find Dan's framework
    const { data: frameworks, error: frameworkError } = await supabase
      .from('user_frameworks')
      .select('*')
      .eq('user_email', 'danlynn@gmail.com')
      .order('created_at', { ascending: false })
      .limit(1);

    if (frameworkError || !frameworks || frameworks.length === 0) {
      throw new Error(`No framework found for danlynn@gmail.com: ${frameworkError?.message || 'No data'}`);
    }

    const framework = frameworks[0];
    console.log('[GENERATE-DAN-AI] Found framework:', framework.id);

    // Call the AI insights generation function
    const { data: aiResult, error: aiError } = await supabase.functions.invoke('generate-ai-insights', {
      body: {
        userEmail: 'danlynn@gmail.com',
        frameworkId: framework.id
      }
    });

    if (aiError) {
      throw new Error(`AI generation failed: ${aiError.message}`);
    }

    console.log('[GENERATE-DAN-AI] ✅ AI insights generated successfully!');

    return new Response(JSON.stringify({
      success: true,
      message: "Enterprise AI Strategic Intelligence generated for danlynn@gmail.com",
      framework: {
        id: framework.id,
        created_at: framework.created_at
      },
      aiResult: aiResult,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[GENERATE-DAN-AI] Error:', error);
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