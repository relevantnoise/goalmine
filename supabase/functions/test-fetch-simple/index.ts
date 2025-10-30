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

    console.log('[TEST-FETCH] Fetching framework data for user:', userEmail);

    // Get Firebase UID from profile (following hybrid architecture)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({
        success: true,
        hasFramework: false,
        message: 'No user profile found'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const userId = profile.id;
    console.log('[TEST-FETCH] Using Firebase UID:', userId);

    // Get user's framework instance
    const { data: framework, error: frameworkError } = await supabase
      .from('user_frameworks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (frameworkError) {
      if (frameworkError.code === 'PGRST116') {
        // No framework found
        return new Response(JSON.stringify({
          success: true,
          hasFramework: false,
          message: 'No framework found for user'
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      throw new Error(`Failed to fetch framework: ${frameworkError.message}`);
    }

    console.log('[TEST-FETCH] Framework found:', framework.id);

    // Get framework elements
    const { data: elements, error: elementsError } = await supabase
      .from('pillar_assessments')
      .select('*')
      .eq('framework_id', framework.id)
      .order('pillar_name');

    if (elementsError) {
      throw new Error(`Failed to fetch elements: ${elementsError.message}`);
    }

    console.log('[TEST-FETCH] Elements found:', elements?.length || 0);

    return new Response(JSON.stringify({
      success: true,
      hasFramework: true,
      message: 'Framework data retrieved successfully (simplified)',
      data: {
        framework: {
          id: framework.id,
          userId,
          userEmail,
          createdAt: framework.created_at
        },
        elementsCount: elements?.length || 0,
        assessmentState: 'completed'
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[TEST-FETCH] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      hasFramework: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);