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
    console.log('[RESET-EMAIL-STATE] Starting database state reset for email recovery');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, check what we're dealing with
    const { data: beforeReset, error: beforeError } = await supabase
      .from('goals')
      .select('id, title, user_id, last_motivation_date, is_active')
      .eq('is_active', true);

    if (beforeError) {
      throw beforeError;
    }

    console.log(`[RESET-EMAIL-STATE] Found ${beforeReset?.length || 0} active goals`);
    
    const goalsWithDates = beforeReset?.filter(g => g.last_motivation_date) || [];
    const goalsWithoutDates = beforeReset?.filter(g => !g.last_motivation_date) || [];
    
    console.log(`[RESET-EMAIL-STATE] Goals with last_motivation_date: ${goalsWithDates.length}`);
    console.log(`[RESET-EMAIL-STATE] Goals without last_motivation_date: ${goalsWithoutDates.length}`);

    // Log the current state
    if (goalsWithDates.length > 0) {
      console.log('[RESET-EMAIL-STATE] Goals that will be reset:');
      goalsWithDates.forEach(goal => {
        console.log(`  - "${goal.title}" (${goal.user_id}) - last email: ${goal.last_motivation_date}`);
      });
    }

    // Reset all active goals to allow email retry
    const { data: resetResult, error: resetError } = await supabase
      .from('goals')
      .update({ last_motivation_date: null })
      .eq('is_active', true)
      .select('id, title');

    if (resetError) {
      throw resetError;
    }

    console.log(`[RESET-EMAIL-STATE] Successfully reset ${resetResult?.length || 0} goals`);

    // Verify the reset worked
    const { data: afterReset, error: afterError } = await supabase
      .from('goals')
      .select('id, title, user_id, last_motivation_date')
      .eq('is_active', true)
      .not('last_motivation_date', 'is', null);

    if (afterError) {
      console.warn('[RESET-EMAIL-STATE] Warning: Could not verify reset:', afterError);
    } else {
      const remainingWithDates = afterReset?.length || 0;
      if (remainingWithDates > 0) {
        console.warn(`[RESET-EMAIL-STATE] Warning: ${remainingWithDates} goals still have last_motivation_date set`);
      } else {
        console.log('[RESET-EMAIL-STATE] ✅ All active goals successfully reset - ready for email retry');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Database state reset complete. ${resetResult?.length || 0} goals ready for email retry.`,
        details: {
          goalsReset: resetResult?.length || 0,
          goalsBefore: beforeReset?.length || 0,
          goalsWithDatesCleared: goalsWithDates.length,
          goalsAlreadyNull: goalsWithoutDates.length
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[RESET-EMAIL-STATE] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Failed to reset database state'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);