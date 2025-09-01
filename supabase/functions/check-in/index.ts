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
    const { goalId, userId } = await req.json();

    if (!goalId || !userId) {
      return new Response(JSON.stringify({ error: "Missing goalId or userId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current goal
    const { data: goal, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Calculate current "streak day" in Eastern Time (3 AM reset, handles EST/EDT automatically)
    const now = new Date();
    
    // Get the current time in Eastern Time using proper timezone
    const easternTimeStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
    const easternTime = new Date(easternTimeStr);
    
    // Subtract 3 hours so day changes at 3 AM Eastern
    const streakDay = new Date(easternTime.getTime() - (3 * 60 * 60 * 1000));
    const currentStreakDate = streakDay.toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if user already checked in today
    const lastCheckinDate = goal.last_checkin_date;
    let lastCheckinStreakDate = '';
    
    if (lastCheckinDate) {
      const lastCheckin = new Date(lastCheckinDate);
      const lastCheckinEasternStr = lastCheckin.toLocaleString("en-US", { timeZone: "America/New_York" });
      const lastCheckinEastern = new Date(lastCheckinEasternStr);
      const lastStreakDay = new Date(lastCheckinEastern.getTime() - (3 * 60 * 60 * 1000));
      lastCheckinStreakDate = lastStreakDay.toISOString().split('T')[0];
    }

    console.log('🕐 Check-in timing:', {
      currentStreakDate,
      lastCheckinStreakDate,
      alreadyCheckedIn: currentStreakDate === lastCheckinStreakDate
    });

    // Prevent multiple check-ins on the same streak day
    if (currentStreakDate === lastCheckinStreakDate) {
      return new Response(JSON.stringify({ 
        error: "You've already checked in today! Come back tomorrow after 3 AM EST.",
        alreadyCheckedIn: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Simple streak logic: just add 1 to current streak (honor system)
    const newStreakCount = (goal.streak_count || 0) + 1;

    console.log('📈 Simple streak calculation:', {
      previousStreak: goal.streak_count || 0,
      newStreak: newStreakCount,
      note: 'Honor system - user decides when to reset'
    });

    // Update streak count and last checkin date
    const { data: updatedGoal, error: updateError } = await supabase
      .from('goals')
      .update({
        streak_count: newStreakCount,
        last_checkin_date: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', goalId)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      goal: updatedGoal,
      message: `Checked in! Streak is now ${newStreakCount} day${newStreakCount === 1 ? '' : 's'}.`,
      streakInfo: {
        previousStreak: goal.streak_count || 0,
        newStreak: newStreakCount,
        system: "honor",
        nextCheckInAllowed: "Tomorrow after 3 AM EST"
      }
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