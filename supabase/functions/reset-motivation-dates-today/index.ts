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

    // Get Pacific/Midway date (same logic as send-daily-emails)
    const now = new Date();
    const midwayDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Midway'
    }).format(now);

    console.log(`[RESET] Resetting goals with last_motivation_date = ${midwayDate}`);

    // Reset goals that have been processed today back to yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    const { data: resetGoals, error: resetError } = await supabase
      .from('goals')
      .update({ last_motivation_date: yesterdayDate })
      .eq('is_active', true)
      .eq('last_motivation_date', midwayDate)
      .select('id, title, user_id');

    if (resetError) {
      throw resetError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reset ${resetGoals?.length || 0} goals for reprocessing`,
        debug: {
          midwayDate,
          yesterdayDate,
          resetGoals: resetGoals || [],
          count: resetGoals?.length || 0
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[RESET] Error:', error);
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