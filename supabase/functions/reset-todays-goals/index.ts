import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const todayDate = new Date().toISOString().split('T')[0];
    console.log(`[RESET-GOALS] Resetting goals marked as processed today: ${todayDate}`);

    // Reset last_motivation_date for goals marked today so they can receive emails
    const { data, error } = await supabase
      .from('goals')
      .update({ last_motivation_date: null })
      .eq('is_active', true)
      .eq('last_motivation_date', todayDate);

    if (error) {
      console.error('[RESET-GOALS] Error resetting goals:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[RESET-GOALS] Successfully reset goals for email eligibility`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reset goals marked today (${todayDate}) to be eligible for emails again`,
        todayDate,
        resetCount: data?.length || 0
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('[RESET-GOALS] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);