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

    console.log('[CLEANUP] Removing danlynn@gmail.com goals to stop duplicate emails');

    // Delete motivation history first (foreign key constraint)
    const { error: motivationError } = await supabase
      .from('motivation_history')
      .delete()
      .eq('user_id', 'danlynn@gmail.com');

    if (motivationError) {
      console.error('[CLEANUP] Error deleting motivation history:', motivationError);
    } else {
      console.log('[CLEANUP] Deleted motivation history for danlynn@gmail.com');
    }

    // Delete goals
    const { data: deletedGoals, error: goalsError } = await supabase
      .from('goals')
      .delete()
      .eq('user_id', 'danlynn@gmail.com')
      .select();

    if (goalsError) {
      throw goalsError;
    }

    console.log(`[CLEANUP] Deleted ${deletedGoals?.length || 0} goals for danlynn@gmail.com`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully deleted ${deletedGoals?.length || 0} goals for danlynn@gmail.com`,
        deletedGoals: deletedGoals?.map(g => ({ id: g.id, title: g.title }))
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CLEANUP] Error:', error);
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