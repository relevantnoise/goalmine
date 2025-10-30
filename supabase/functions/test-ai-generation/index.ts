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
    
    console.log('[TEST] Testing AI generation for:', userEmail);

    // First get the user profile to find the Firebase UID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Then get the framework ID
    const { data: framework } = await supabase
      .from('user_frameworks')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (!framework) {
      throw new Error('Framework not found for user');
    }

    console.log('[TEST] Found framework ID:', framework.id);

    // Call the generate-ai-insights function with correct framework ID
    const { data: aiResult, error: aiError } = await supabase.functions.invoke('generate-ai-insights', {
      body: {
        userEmail: userEmail,
        frameworkId: framework.id
      }
    });

    return new Response(JSON.stringify({
      success: !aiError,
      userEmail,
      aiResult,
      aiError: aiError?.message || null,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[TEST] Error:', error);
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