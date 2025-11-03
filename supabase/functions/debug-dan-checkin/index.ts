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

    console.log('🔍 DEBUG: Checking danlynn@gmail.com check-in status');

    // Get danlynn's goals (both architectures)
    const { data: emailGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', 'danlynn@gmail.com')
      .eq('is_active', true);

    // Also check Firebase UID approach
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'danlynn@gmail.com')
      .single();

    let firebaseGoals = [];
    if (profile?.id) {
      const { data: uidGoals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true);
      firebaseGoals = uidGoals || [];
    }

    const allGoals = [...(emailGoals || []), ...firebaseGoals];

    // Calculate current time and check-in logic
    const now = new Date();
    const utcTime = now.getTime();
    const easternOffset = now.toLocaleString("en-US", { timeZone: "America/New_York" }).includes('EDT') ? -4 : -5;
    const easternTime = new Date(utcTime + (easternOffset * 60 * 60 * 1000));
    const streakResetTime = new Date(easternTime.getTime() - (3 * 60 * 60 * 1000));
    const currentStreakDate = streakResetTime.toISOString().split('T')[0];

    const result = {
      timestamp: now.toISOString(),
      easternTime: easternTime.toISOString(),
      currentStreakDate,
      profile: profile,
      totalGoals: allGoals.length,
      goals: allGoals.map(goal => {
        let lastCheckinStreakDate = '';
        if (goal.last_checkin_date) {
          const lastCheckinTime = new Date(goal.last_checkin_date);
          const lastUtcTime = lastCheckinTime.getTime();
          const lastEasternTime = new Date(lastUtcTime + (easternOffset * 60 * 60 * 1000));
          const lastStreakResetTime = new Date(lastEasternTime.getTime() - (3 * 60 * 60 * 1000));
          lastCheckinStreakDate = lastStreakResetTime.toISOString().split('T')[0];
        }

        const canCheckInToday = currentStreakDate !== lastCheckinStreakDate;

        return {
          id: goal.id,
          title: goal.title,
          user_id: goal.user_id,
          streak_count: goal.streak_count,
          last_checkin_date: goal.last_checkin_date,
          lastCheckinStreakDate,
          currentStreakDate,
          canCheckInToday,
          blocked: !canCheckInToday,
          architecture: goal.user_id.includes('@') ? 'email' : 'firebase_uid'
        };
      })
    };

    console.log('📊 DEBUG RESULT:', result);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ DEBUG ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});