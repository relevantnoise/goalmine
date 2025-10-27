import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { user_id } = body;

    console.log('🔍 Fetching circle framework for user:', user_id);

    if (!user_id) {
      return new Response(JSON.stringify({
        success: false,
        error: "user_id is required"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create Supabase client with service role (bypasses RLS) - SAME AS GOALS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log('🔍 Looking for circle framework for email:', user_id);
    
    // Look for framework by email (same as goals pattern)
    const { data: frameworks, error: frameworkError } = await supabase
      .from('user_circle_frameworks')
      .select('*')
      .eq('user_email', user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (frameworkError) {
      console.error('❌ Error fetching framework:', frameworkError);
      return new Response(JSON.stringify({
        success: false,
        error: `Database error: ${frameworkError.message}`,
        hasFramework: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!frameworks || frameworks.length === 0) {
      console.log('📝 No framework found for user');
      return new Response(JSON.stringify({
        success: true,
        hasFramework: false,
        framework: null,
        allocations: [],
        workHappiness: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const framework = frameworks[0];
    console.log('✅ Found framework:', framework.id);

    // Fetch circle allocations
    console.log('🔍 Fetching circle allocations for framework:', framework.id);
    const { data: allocations, error: allocError } = await supabase
      .from('circle_time_allocations')
      .select('*')
      .eq('framework_id', framework.id);

    if (allocError) {
      console.error('❌ Error fetching allocations:', allocError);
      return new Response(JSON.stringify({
        success: false,
        error: `Error fetching allocations: ${allocError.message}`,
        hasFramework: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Fetch work happiness metrics
    console.log('🔍 Fetching work happiness metrics for framework:', framework.id);
    const { data: workHappiness, error: happinessError } = await supabase
      .from('work_happiness_metrics')
      .select('*')
      .eq('framework_id', framework.id)
      .limit(1);

    if (happinessError) {
      console.error('❌ Error fetching work happiness:', happinessError);
      return new Response(JSON.stringify({
        success: false,
        error: `Error fetching work happiness: ${happinessError.message}`,
        hasFramework: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log('✅ Successfully fetched complete circle framework data');

    return new Response(JSON.stringify({
      success: true,
      hasFramework: true,
      framework,
      allocations: allocations || [],
      workHappiness: (workHappiness && workHappiness.length > 0) ? workHappiness[0] : null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in fetch-circle-framework function:', errorMessage);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      hasFramework: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});