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
    const userEmail = 'danlynn@gmail.com';
    
    console.log('[DEBUG] Checking assessment completion for:', userEmail);

    // Get Firebase UID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No user profile found',
        userEmail
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const userId = profile.id;
    console.log('[DEBUG] Firebase UID:', userId);

    // Check user_frameworks table
    const { data: frameworks, error: frameworkError } = await supabase
      .from('user_frameworks')
      .select('*')
      .eq('user_id', userId);

    // Check pillar_assessments table
    const { data: pillars, error: pillarsError } = await supabase
      .from('pillar_assessments')
      .select('*')
      .eq('framework_id', userId);

    // Check work_happiness table
    const { data: workHappiness, error: workError } = await supabase
      .from('work_happiness')
      .select('*')
      .eq('framework_id', userId);

    // Check ai_insights table
    const { data: insights, error: insightsError } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('framework_id', userEmail); // Note: AI insights uses email as framework_id

    return new Response(JSON.stringify({
      success: true,
      userEmail,
      userId,
      data: {
        frameworks: frameworks || [],
        pillars: pillars || [],
        workHappiness: workHappiness || [],
        insights: insights || []
      },
      errors: {
        frameworkError,
        pillarsError,
        workError,
        insightsError
      },
      summary: {
        hasFramework: (frameworks && frameworks.length > 0),
        hasPillars: (pillars && pillars.length > 0),
        hasWorkHappiness: (workHappiness && workHappiness.length > 0),
        hasInsights: (insights && insights.length > 0)
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DEBUG] Error:', error);
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