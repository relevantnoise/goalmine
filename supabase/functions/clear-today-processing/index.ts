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

    // Get today's date in Pacific/Midway format (matching send-daily-emails)
    const now = new Date();
    const midwayDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Midway'
    }).format(now);
    const todayDate = midwayDate;

    console.log(`[CLEAR-TODAY] Clearing last_motivation_date for ${todayDate}`);

    // Clear today's processing marks so goals can be processed again
    const { data, error } = await supabase
      .from('goals')
      .update({ last_motivation_date: null })
      .eq('last_motivation_date', todayDate)
      .select('id, title');

    if (error) {
      console.error('[CLEAR-TODAY] Error clearing dates:', error);
      throw error;
    }

    const clearedCount = data?.length || 0;
    console.log(`[CLEAR-TODAY] Cleared ${clearedCount} goals for ${todayDate}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleared ${clearedCount} goals for ${todayDate}`,
        clearedGoals: data?.map(g => g.title) || [],
        date: todayDate
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CLEAR-TODAY] Fatal error:', error);
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