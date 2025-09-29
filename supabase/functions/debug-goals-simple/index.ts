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

    // Get current date in Pacific/Midway timezone (same as email function)
    const now = new Date();
    const midwayDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Midway'
    }).format(now);
    
    console.log(`[DEBUG] Current Midway date: ${midwayDate}`);

    // Check all goals with relevant fields
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, user_id, is_active, last_motivation_date, target_date')
      .eq('is_active', true);

    console.log('[DEBUG] All active goals:', JSON.stringify(goals, null, 2));

    // Check what the email query would find
    const { data: emailCandidates, error: candidateError } = await supabase
      .from('goals')
      .select('id, title, user_id, last_motivation_date')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${midwayDate}`);

    console.log('[DEBUG] Email candidates:', JSON.stringify(emailCandidates, null, 2));

    return new Response(
      JSON.stringify({ 
        currentDate: midwayDate,
        allActiveGoals: goals,
        emailCandidates: emailCandidates,
        candidatesCount: emailCandidates?.length || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG] Error:', error);
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