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
    console.log('[EMERGENCY-RESET] Resetting all goals for immediate email delivery');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Reset ALL active goals so emails can be sent today
    const { data: resetData, error: resetError } = await supabase
      .from('goals')
      .update({ last_motivation_date: null })
      .eq('is_active', true)
      .select('id, title, user_id');

    if (resetError) {
      console.error('[EMERGENCY-RESET] Error:', resetError);
      throw resetError;
    }

    console.log(`[EMERGENCY-RESET] Reset ${resetData?.length || 0} goals for email delivery`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `EMERGENCY RESET: ${resetData?.length || 0} goals ready for email delivery`,
        resetGoals: resetData
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[EMERGENCY-RESET] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);