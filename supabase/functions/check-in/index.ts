import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Phase 5: Permission helper functions (copied from frontend)
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

function getGoalPermissions(goal: any, profile: any, isSubscribed: boolean) {
  const trialExpired = isTrialExpired(profile);
  const goalExpired = isGoalExpired(goal);
  
  // Priority: Trial expiration > Goal expiration > Normal operation
  if (trialExpired && !isSubscribed) {
    // Trial expired, no subscription = no permissions
    return {
      canEdit: false,
      canDelete: false,
      canCheckIn: false,
      canShare: false,
      canReceiveEmails: false,
      canGenerateNudge: false,
    };
  }
  
  if (goalExpired) {
    // Goal expired = edit/delete only
    return {
      canEdit: true,
      canDelete: true,
      canCheckIn: false,
      canShare: false,
      canReceiveEmails: false,
      canGenerateNudge: false,
    };
  }
  
  // Normal operation = all permissions
  return {
    canEdit: true,
    canDelete: true,
    canCheckIn: true,
    canShare: true,
    canReceiveEmails: true,
    canGenerateNudge: true,
  };
}

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

    // HYBRID: Find goal using both email AND Firebase UID approaches
    console.log('🔍 HYBRID: Looking for goal using both email and Firebase UID approaches');
    
    // First, try to get profile to find Firebase UID
    const { data: userProfileResults } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userId);
    
    const userProfile = userProfileResults && userProfileResults.length > 0 ? userProfileResults[0] : null;

    let goal = null;
    let fetchError = null;
    
    // Try 1: Look for goal with email as user_id (OLD architecture)
    const { data: goalByEmailResults, error: emailError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId);
    
    const goalByEmail = goalByEmailResults && goalByEmailResults.length > 0 ? goalByEmailResults[0] : null;
    
    if (goalByEmail) {
      goal = goalByEmail;
      console.log('✅ Found goal using email approach');
    } else if (userProfile?.id) {
      // Try 2: Look for goal with Firebase UID as user_id (NEW architecture)
      console.log('🔍 Trying Firebase UID approach:', userProfile.id);
      const { data: goalByUIDResults, error: uidError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userProfile.id);
      
      const goalByUID = goalByUIDResults && goalByUIDResults.length > 0 ? goalByUIDResults[0] : null;
      
      if (goalByUID) {
        goal = goalByUID;
        console.log('✅ Found goal using Firebase UID approach');
      } else {
        fetchError = uidError || emailError || new Error('Goal not found');
      }
    } else {
      fetchError = emailError || new Error('Goal not found');
    }

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get user profile and subscription status using hybrid approach
    let profile = null;
    if (userProfile) {
      // We already have profile from the goal lookup above
      const { data: fullProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userProfile.id)
        .single();
      profile = fullProfile;
    }

    const { data: subscription } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userId) // Subscribers table uses email
      .single();

    const isSubscribed = subscription?.status === 'active';

    // Phase 5: Check permissions before allowing check-in
    const permissions = getGoalPermissions(goal, profile, isSubscribed);
    
    if (!permissions.canCheckIn) {
      const trialExpired = isTrialExpired(profile);
      const goalExpired = isGoalExpired(goal);
      
      let message = "Check-in not allowed.";
      if (trialExpired && !isSubscribed) {
        message = "Your 30-day free trial has expired. Please upgrade to continue checking in.";
      } else if (goalExpired) {
        message = "This goal has reached its target date. Edit the goal to extend the date if you want to continue.";
      }
      
      return new Response(JSON.stringify({ 
        error: message,
        permissions: permissions,
        needsUpgrade: trialExpired && !isSubscribed
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
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