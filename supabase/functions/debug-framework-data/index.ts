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
    const userEmail = "danlynn@gmail.com";
    
    console.log('[DEBUG] Checking data for:', userEmail);

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    console.log('[DEBUG] Profile:', profile, profileError);

    if (!profile) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No profile found',
        data: { profile: null }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Check frameworks
    const { data: frameworks, error: frameworkError } = await supabase
      .from('user_frameworks')
      .select('*')
      .eq('user_id', profile.id);

    console.log('[DEBUG] Frameworks:', frameworks, frameworkError);

    // Check pillar assessments
    const { data: pillars, error: pillarError } = await supabase
      .from('pillar_assessments')
      .select('*');

    console.log('[DEBUG] All pillars:', pillars, pillarError);
    
    // Check specifically for Dan's pillars
    const { data: danPillars, error: danPillarError } = await supabase
      .from('pillar_assessments')
      .select('*')
      .eq('framework_id', frameworks?.[0]?.id);

    console.log('[DEBUG] Dans pillars for framework:', danPillars, danPillarError);

    // Check work happiness
    const { data: workHappiness, error: workError } = await supabase
      .from('work_happiness')
      .select('*');

    console.log('[DEBUG] Work happiness:', workHappiness, workError);

    return new Response(JSON.stringify({
      success: true,
      data: {
        profile,
        frameworks,
        pillars,
        workHappiness,
        userId: profile.id
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DEBUG] Error:', error);
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