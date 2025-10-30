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
    
    console.log('[RESET] Cleaning framework data for:', userEmail);

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    const userId = profile.id;
    console.log('[RESET] User ID:', userId);

    // Get user's frameworks
    const { data: frameworks } = await supabase
      .from('user_frameworks')
      .select('id')
      .eq('user_id', userId);

    console.log('[RESET] Found frameworks:', frameworks?.length || 0);

    for (const framework of frameworks || []) {
      console.log('[RESET] Deleting data for framework:', framework.id);
      
      // Delete framework elements
      await supabase
        .from('framework_elements')
        .delete()
        .eq('framework_id', framework.id);
      
      // Delete work happiness  
      await supabase
        .from('work_happiness')
        .delete()
        .eq('framework_id', framework.id);
      
      // Delete AI insights
      await supabase
        .from('ai_insights')
        .delete()
        .eq('framework_id', framework.id);
      
      // Delete weekly checkins
      await supabase
        .from('weekly_checkins')
        .delete()
        .eq('framework_id', framework.id);
      
      // Delete the framework itself
      await supabase
        .from('user_frameworks')
        .delete()
        .eq('id', framework.id);
    }

    console.log('[RESET] Framework data cleaned successfully');

    return new Response(JSON.stringify({
      success: true,
      message: `Cleaned ${frameworks?.length || 0} framework(s) for ${userEmail}`,
      userId
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[RESET] Error:', error);
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