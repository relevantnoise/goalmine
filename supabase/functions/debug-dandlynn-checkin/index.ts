import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper functions (copied from check-in)
function isTrialExpired(profile: any): boolean {
  if (!profile?.trial_expires_at) return false;
  return new Date(profile.trial_expires_at) < new Date();
}

function isGoalExpired(goal: any): boolean {
  if (!goal.target_date) return false;
  const targetDate = new Date(goal.target_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return targetDate < today;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const userId = "dandlynn@yahoo.com";
    
    console.log("🔍 Debugging dandlynn@yahoo.com check-in issue");

    // 1. Check profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userId);

    // 2. Check goals for this user (both architectures)
    const { data: goalsByEmail } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);
    
    let goalsByUID = [];
    if (profileData && profileData.length > 0) {
      const profile = profileData[0];
      const { data: uidGoals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', profile.id);
      goalsByUID = uidGoals || [];
    }

    // 3. Check subscription status
    const { data: subscription } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userId);

    // 4. Calculate permissions for each goal
    const profile = profileData && profileData.length > 0 ? profileData[0] : null;
    const isSubscribed = subscription?.status === 'active';
    const trialExpired = isTrialExpired(profile);

    const allGoals = [...(goalsByEmail || []), ...goalsByUID];
    const goalAnalysis = allGoals.map(goal => {
      const goalExpired = isGoalExpired(goal);
      return {
        id: goal.id,
        title: goal.title,
        target_date: goal.target_date,
        user_id: goal.user_id,
        architecture: goal.user_id.includes('@') ? 'email-based' : 'firebase-uid',
        streak_count: goal.streak_count,
        last_checkin_date: goal.last_checkin_date,
        goalExpired,
        canCheckIn: !trialExpired && !goalExpired,
        expiredReason: goalExpired ? 'goal-expired' : (trialExpired ? 'trial-expired' : 'none')
      };
    });

    // 5. Check current time and streak calculation
    const now = new Date();
    const utcTime = now.getTime();
    const easternOffset = now.toLocaleString("en-US", { timeZone: "America/New_York" }).includes('EDT') ? -4 : -5;
    const easternTime = new Date(utcTime + (easternOffset * 60 * 60 * 1000));
    const streakResetTime = new Date(easternTime.getTime() - (3 * 60 * 60 * 1000));
    const currentStreakDate = streakResetTime.toISOString().split('T')[0];

    const debugInfo = {
      userId,
      currentTime: now.toISOString(),
      easternTime: easternTime.toISOString(),
      currentStreakDate,
      profile: {
        found: !!profile,
        data: profile,
        trial_expires_at: profile?.trial_expires_at,
        trialExpired,
      },
      subscription: {
        found: !!subscription,
        data: subscription,
        isSubscribed,
      },
      goals: {
        totalFound: allGoals.length,
        byEmail: goalsByEmail?.length || 0,
        byUID: goalsByUID.length,
        analysis: goalAnalysis,
      },
      errors: {
        profileError: profileError?.message,
      }
    };

    return new Response(JSON.stringify(debugInfo, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});