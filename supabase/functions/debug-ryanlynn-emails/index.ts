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

    console.log('[DEBUG-RYANLYNN] Starting investigation for ryanlynn@umich.edu email issue');

    // Check for ryanlynn@umich.edu goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .or('user_id.ilike.%ryanlynn%,user_id.ilike.%umich%')
      .order('created_at', { ascending: false });

    if (goalsError) {
      console.error('[DEBUG-RYANLYNN] Error fetching goals:', goalsError);
      throw goalsError;
    }

    console.log(`[DEBUG-RYANLYNN] Found ${goals?.length || 0} goals for ryanlynn@umich.edu`);

    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .or('email.ilike.%ryanlynn%,email.ilike.%umich%,id.ilike.%ryanlynn%,id.ilike.%umich%')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('[DEBUG-RYANLYNN] Error fetching profiles:', profilesError);
    }

    // Check subscription status
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscribers')
      .select('*')
      .or('user_id.ilike.%ryanlynn%,user_id.ilike.%umich%,email.ilike.%ryanlynn%,email.ilike.%umich%')
      .order('created_at', { ascending: false });

    if (subsError) {
      console.error('[DEBUG-RYANLYNN] Error fetching subscriptions:', subsError);
    }

    // Check recent motivation history
    const ryanlynGoalIds = goals?.map(g => g.id) || [];
    let motivationHistory = [];
    if (ryanlynGoalIds.length > 0) {
      const { data: history, error: historyError } = await supabase
        .from('motivation_history')
        .select('*')
        .in('goal_id', ryanlynGoalIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyError) {
        console.error('[DEBUG-RYANLYNN] Error fetching motivation history:', historyError);
      } else {
        motivationHistory = history || [];
      }
    }

    // Get current time info
    const now = new Date();
    const easternTime = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const midwayDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Midway'
    }).format(now);

    const utcTime = now.toISOString();

    // Check if today's cron has run
    const todayDate = midwayDate;
    const eligibleGoals = goals?.filter(g => 
      g.is_active && 
      (!g.last_motivation_date || g.last_motivation_date < todayDate)
    ) || [];

    const response = {
      debug: {
        currentEasternTime: easternTime,
        currentUTC: utcTime,
        pacificMidwayDate: midwayDate,
        investigationTime: new Date().toISOString()
      },
      goals: goals?.map(g => ({
        id: g.id,
        title: g.title,
        user_id: g.user_id,
        created_at: g.created_at,
        last_motivation_date: g.last_motivation_date,
        last_check_in: g.last_check_in,
        is_active: g.is_active,
        streak_count: g.streak_count,
        eligibleForToday: !g.last_motivation_date || g.last_motivation_date < todayDate
      })) || [],
      profiles: profiles || [],
      subscriptions: subscriptions || [],
      motivationHistory: motivationHistory.map(h => ({
        id: h.id,
        goal_id: h.goal_id,
        user_id: h.user_id,
        created_at: h.created_at,
        message_preview: h.message?.substring(0, 100) + '...',
        streak_count: h.streak_count
      })),
      analysis: {
        totalGoals: goals?.length || 0,
        activeGoals: goals?.filter(g => g.is_active)?.length || 0,
        eligibleForTodayEmail: eligibleGoals.length,
        hasProfile: (profiles?.length || 0) > 0,
        hasSubscription: (subscriptions?.length || 0) > 0,
        recentMotivationCount: motivationHistory.length
      },
      possibleCauses: [
        eligibleGoals.length > 1 ? "MULTIPLE ELIGIBLE GOALS - Could explain 2 emails" : null,
        goals?.some(g => g.created_at && new Date(g.created_at).toDateString() === new Date().toDateString()) ? "GOAL CREATED TODAY - Could trigger immediate email" : null,
        "MANUAL TRIGGER - Someone may have manually triggered emails",
        "TIMEZONE ISSUE - Pacific/Midway timing may still have bugs",
        "FUNCTION CALLED TWICE - Race condition or duplicate cron execution"
      ].filter(Boolean)
    };

    console.log('[DEBUG-RYANLYNN] Investigation complete:', response.analysis);

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG-RYANLYNN] Fatal error:', error);
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