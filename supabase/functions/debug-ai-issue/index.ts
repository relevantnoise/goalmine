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
    // Skip auth check for this debug function
    console.log('[DEBUG-AI] Public debug function called');
    const userEmail = 'danlynn@gmail.com';
    console.log('[DEBUG-AI] Finding framework data for:', userEmail);

    // Step 1: Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    console.log('[DEBUG-AI] Profile found:', profile.id);

    // Step 2: Find framework ID
    const { data: framework, error: frameworkError } = await supabase
      .from('user_frameworks')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('[DEBUG-AI] Framework query result:', framework, frameworkError);

    if (!framework || framework.length === 0) {
      throw new Error('No framework found');
    }

    const frameworkId = framework[0].id;
    console.log('[DEBUG-AI] Using framework ID:', frameworkId);

    // Step 3: Directly call generate-ai-insights
    console.log('[DEBUG-AI] Calling generate-ai-insights...');
    
    const { data: aiResult, error: aiError } = await supabase.functions.invoke('generate-ai-insights', {
      body: {
        userEmail: userEmail,
        frameworkId: frameworkId
      }
    });

    console.log('[DEBUG-AI] AI generation result:', aiResult, aiError);

    if (aiError) {
      throw new Error(`AI generation failed: ${aiError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'AI insights generated successfully!',
      frameworkId,
      aiResult,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DEBUG-AI] Error:', error);
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