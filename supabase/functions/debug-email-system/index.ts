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
    console.log('[DEBUG] Starting email system debug');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);

    console.log('[DEBUG] Profiles:', profiles?.length, 'Error:', profilesError);
    if (profiles) {
      profiles.forEach(p => console.log('Profile:', p.id, p.email));
    }

    // Check active goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .limit(10);

    console.log('[DEBUG] Active goals:', goals?.length, 'Error:', goalsError);
    if (goals) {
      goals.forEach(g => console.log('Goal:', g.id, g.title, 'User:', g.user_id));
    }

    // Get current date in Pacific/Midway timezone (same as email function)
    const now = new Date();
    const midwayDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Midway'
    }).format(now);
    
    console.log(`[DEBUG] Current Midway date: ${midwayDate}`);

    // Check what the email query would find
    const { data: emailCandidates, error: candidateError } = await supabase
      .from('goals')
      .select('id, title, user_id, last_motivation_date, target_date, is_active')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${midwayDate}`);

    console.log('[DEBUG] Email candidates:', JSON.stringify(emailCandidates, null, 2));
    console.log('[DEBUG] All goals:', JSON.stringify(goals, null, 2));

    // TEMP FIX: Reset email dates for testing (remove after fixing)
    const { searchParams } = new URL(req.url);
    const shouldReset = searchParams.get('reset') === 'true';
    
    let resetResults = null;
    if (shouldReset) {
      console.log('[DEBUG] RESETTING email dates for testing...');
      const { data: resetData, error: resetError } = await supabase
        .from('goals')
        .update({ last_motivation_date: null })
        .in('user_id', ['danlynn@gmail.com', 'dandlynn@yahoo.com'])
        .eq('is_active', true)
        .select('*');
      
      if (resetError) {
        console.error('[DEBUG] Reset error:', resetError);
      } else {
        console.log('[DEBUG] Reset successful:', resetData?.length);
        resetResults = resetData;
      }
    }

    return new Response(
      JSON.stringify({ 
        currentDate: midwayDate,
        profiles: profiles?.length || 0,
        allActiveGoals: goals?.length || 0,
        emailCandidates: emailCandidates?.length || 0,
        candidatesData: emailCandidates,
        allGoalsData: goals,
        resetResults: resetResults,
        debug: 'Check logs for details'
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