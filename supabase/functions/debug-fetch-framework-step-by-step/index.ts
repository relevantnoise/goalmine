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
    const testEmail = userEmail || "danlynn@gmail.com";
    
    console.log('[DEBUG-STEP] Testing framework fetch for:', testEmail);

    // Step 1: Test profile lookup
    console.log('[DEBUG-STEP] Step 1: Looking up profile');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', testEmail)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({
        step: 'profile_lookup',
        success: false,
        error: profileError.message,
        code: profileError.code
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log('[DEBUG-STEP] Profile found:', profile);
    const userId = profile.id;

    // Step 2: Test framework lookup
    console.log('[DEBUG-STEP] Step 2: Looking up framework');
    const { data: framework, error: frameworkError } = await supabase
      .from('user_frameworks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (frameworkError) {
      return new Response(JSON.stringify({
        step: 'framework_lookup',
        success: false,
        error: frameworkError.message,
        code: frameworkError.code,
        userId
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log('[DEBUG-STEP] Framework query result:', framework);

    if (!framework || framework.length === 0) {
      return new Response(JSON.stringify({
        step: 'framework_lookup',
        success: true,
        message: 'No framework found',
        userId,
        frameworkCount: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const frameworkData = framework[0];
    console.log('[DEBUG-STEP] Framework found:', frameworkData);

    // Step 3: Test elements lookup
    console.log('[DEBUG-STEP] Step 3: Looking up pillar assessments');
    const { data: elements, error: elementsError } = await supabase
      .from('pillar_assessments')
      .select('*')
      .eq('framework_id', frameworkData.id)
      .order('pillar_name');

    if (elementsError) {
      return new Response(JSON.stringify({
        step: 'elements_lookup',
        success: false,
        error: elementsError.message,
        code: elementsError.code,
        frameworkId: frameworkData.id
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log('[DEBUG-STEP] Elements found:', elements?.length || 0);

    // Step 4: Test work happiness lookup
    console.log('[DEBUG-STEP] Step 4: Looking up work happiness');
    const { data: workHappiness, error: workError } = await supabase
      .from('work_happiness')
      .select('*')
      .eq('framework_id', frameworkData.id)
      .single();

    if (workError && workError.code !== 'PGRST116') {
      return new Response(JSON.stringify({
        step: 'work_happiness_lookup',
        success: false,
        error: workError.message,
        code: workError.code,
        frameworkId: frameworkData.id
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log('[DEBUG-STEP] Work happiness found:', !!workHappiness);

    return new Response(JSON.stringify({
      success: true,
      message: 'All steps completed successfully',
      data: {
        profile,
        framework: frameworkData,
        elementsCount: elements?.length || 0,
        elements: elements || [],
        workHappiness: !!workHappiness,
        workHappinessData: workHappiness
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DEBUG-STEP] Unexpected error:', error);
    return new Response(JSON.stringify({
      step: 'unexpected_error',
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);