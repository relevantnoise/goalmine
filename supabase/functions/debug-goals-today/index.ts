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
    console.log(`[DEBUG] Today's date: ${todayDate}`);

    // Check all goals
    const { data: allGoals, error: allGoalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (allGoalsError) {
      console.error('[DEBUG] Error fetching all goals:', allGoalsError);
      return new Response(
        JSON.stringify({ success: false, error: allGoalsError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which goals should get emails today
    const { data: eligibleGoals, error: eligibleError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${todayDate}`);

    if (eligibleError) {
      console.error('[DEBUG] Error fetching eligible goals:', eligibleError);
      return new Response(
        JSON.stringify({ success: false, error: eligibleError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check profiles for trial status
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('[DEBUG] Error fetching profiles:', profilesError);
    }

    // Check subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('subscribers')
      .select('*');

    if (subscribersError) {
      console.error('[DEBUG] Error fetching subscribers:', subscribersError);
    }

    const result = {
      success: true,
      todayDate,
      totalActiveGoals: allGoals?.length || 0,
      eligibleGoals: eligibleGoals?.length || 0,
      totalProfiles: profiles?.length || 0,
      totalSubscribers: subscribers?.length || 0,
      goalDetails: allGoals?.map(g => ({
        id: g.id,
        title: g.title,
        user_id: g.user_id,
        is_active: g.is_active,
        target_date: g.target_date,
        last_motivation_date: g.last_motivation_date,
        created_at: g.created_at,
        isEligible: !g.last_motivation_date || g.last_motivation_date < todayDate
      })),
      profileDetails: profiles?.map(p => ({
        id: p.id,
        email: p.email,
        trial_expires_at: p.trial_expires_at,
        isTrialExpired: p.trial_expires_at ? new Date(p.trial_expires_at) < new Date() : false
      })),
      subscriberDetails: subscribers?.map(s => ({
        user_id: s.user_id,
        subscribed: s.subscribed,
        plan_name: s.plan_name,
        status: s.status
      }))
    };

    console.log('[DEBUG] Results:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify(result, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('[DEBUG] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);