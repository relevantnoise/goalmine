import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userEmail } = await req.json();
    
    console.log('🔍 DEBUG: Checking goals state for user:', userEmail);

    // Get all goals for this user (hybrid lookup)
    const { data: goalsByEmail } = await supabase
      .from('goals')
      .select('id, title, streak_count, last_checkin_date, updated_at, user_id')
      .eq('user_id', userEmail);

    // Also try Firebase UID lookup
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    let goalsByUID = [];
    if (profile?.id) {
      const { data } = await supabase
        .from('goals')
        .select('id, title, streak_count, last_checkin_date, updated_at, user_id')
        .eq('user_id', profile.id);
      goalsByUID = data || [];
    }

    const allGoals = [...(goalsByEmail || []), ...goalsByUID];

    // Calculate current streak date using EXACT same logic as check-in function
    const now = new Date();
    const utcTime = now.getTime();
    const easternOffset = now.toLocaleString("en-US", { timeZone: "America/New_York" }).includes('EDT') ? -4 : -5;
    const easternTime = new Date(utcTime + (easternOffset * 60 * 60 * 1000));
    const streakResetTime = new Date(easternTime.getTime() - (3 * 60 * 60 * 1000));
    const currentStreakDate = streakResetTime.toISOString().split('T')[0];

    // Analyze each goal's check-in state
    const goalAnalysis = allGoals.map(goal => {
      let lastCheckinStreakDate = '';
      if (goal.last_checkin_date) {
        const lastCheckinTime = new Date(goal.last_checkin_date);
        const lastUtcTime = lastCheckinTime.getTime();
        const lastEasternTime = new Date(lastUtcTime + (easternOffset * 60 * 60 * 1000));
        const lastStreakResetTime = new Date(lastEasternTime.getTime() - (3 * 60 * 60 * 1000));
        lastCheckinStreakDate = lastStreakResetTime.toISOString().split('T')[0];
      }

      return {
        goalId: goal.id,
        title: goal.title,
        streakCount: goal.streak_count,
        lastCheckinDate: goal.last_checkin_date,
        lastCheckinStreakDate,
        currentStreakDate,
        shouldAllowCheckin: currentStreakDate !== lastCheckinStreakDate,
        timeSinceLastCheckin: goal.last_checkin_date ? 
          Math.round((now.getTime() - new Date(goal.last_checkin_date).getTime()) / 1000 / 60) + ' minutes' : 
          'Never',
        userIdFormat: goal.user_id.includes('@') ? 'email' : 'firebase-uid'
      };
    });

    return new Response(JSON.stringify({ 
      success: true,
      userEmail,
      profileId: profile?.id || 'Not found',
      currentTime: now.toISOString(),
      currentStreakDate,
      easternOffset,
      goalsFound: allGoals.length,
      goalAnalysis,
      diagnosis: goalAnalysis.length > 0 ? 
        (goalAnalysis.some(g => !g.shouldAllowCheckin) ? 
          'ISSUE: Some goals should NOT allow check-in but user can check in multiple times' :
          'All goals should allow check-in based on dates') :
        'No goals found'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});