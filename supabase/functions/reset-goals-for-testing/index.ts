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
    console.log('[RESET-GOALS] Resetting test user goals for email testing');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Reset last_motivation_date for test users
    const { data: resetData, error: resetError } = await supabase
      .from('goals')
      .update({ last_motivation_date: null })
      .in('user_id', ['danlynn@gmail.com', 'dandlynn@gmail.com'])
      .eq('is_active', true)
      .select('*');

    if (resetError) {
      console.error('[RESET-GOALS] Error resetting goals:', resetError);
      throw resetError;
    }

    console.log(`[RESET-GOALS] Successfully reset ${resetData?.length || 0} goals`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reset ${resetData?.length || 0} goals - ready for email testing`,
        resetGoals: resetData?.map(goal => ({ id: goal.id, title: goal.title, user_id: goal.user_id }))
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[RESET-GOALS] Fatal error:', error);
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
