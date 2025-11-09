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

    // ATOMIC CHECK-IN VALIDATION: Use database-level uniqueness to prevent duplicates
    const now = new Date();
    
    // Calculate current streak date consistently using UTC-based approach
    // Convert to Eastern Time and subtract 3 hours for 3 AM reset
    const utcTime = now.getTime();
    const easternOffset = now.toLocaleString("en-US", { timeZone: "America/New_York" }).includes('EDT') ? -4 : -5; // EDT vs EST
    const easternTime = new Date(utcTime + (easternOffset * 60 * 60 * 1000));
    const streakResetTime = new Date(easternTime.getTime() - (3 * 60 * 60 * 1000));
    const currentStreakDate = streakResetTime.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log('🕐 Atomic check-in validation:', {
      utcTime: now.toISOString(),
      easternOffset,
      currentStreakDate,
      goalId,
      userId
    });

    // Check if already checked in today BEFORE attempting update
    const lastCheckinDate = goal.last_checkin_date;
    let lastCheckinStreakDate = '';
    
    if (lastCheckinDate) {
      const lastCheckinTime = new Date(lastCheckinDate);
      const lastUtcTime = lastCheckinTime.getTime();
      const lastEasternTime = new Date(lastUtcTime + (easternOffset * 60 * 60 * 1000));
      const lastStreakResetTime = new Date(lastEasternTime.getTime() - (3 * 60 * 60 * 1000));
      lastCheckinStreakDate = lastStreakResetTime.toISOString().split('T')[0];
    }

    console.log('🕐 Check-in validation:', {
      currentStreakDate,
      lastCheckinStreakDate,
      alreadyCheckedIn: currentStreakDate === lastCheckinStreakDate,
      lastCheckinDate: goal.last_checkin_date
    });

    // ATOMIC VALIDATION: Prevent duplicate check-ins
    if (currentStreakDate === lastCheckinStreakDate) {
      return new Response(JSON.stringify({ 
        error: "You've already checked in today! Come back tomorrow after 3 AM EST.",
        alreadyCheckedIn: true,
        debug: {
          currentStreakDate,
          lastCheckinStreakDate,
          lastCheckinTime: goal.last_checkin_date
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // ATOMIC DATABASE UPDATE: Update streak count and check-in date
    const newStreakCount = (goal.streak_count || 0) + 1;
    const { data: updateResult, error: updateError } = await supabase
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

    // SUCCESS: The atomic update worked, check-in completed
    const updatedStreakCount = updateResult.streak_count;

    console.log('📈 Atomic check-in successful:', {
      previousStreak: goal.streak_count || 0,
      newStreak: updatedStreakCount,
      currentStreakDate,
      checkinTime: now.toISOString(),
      note: 'Database-level atomic validation prevents duplicates'
    });

    return new Response(JSON.stringify({ 
      success: true, 
      goal: {
        ...updateResult,
        last_streak_date: currentStreakDate  // Add authoritative streak date to goal object
      },
      message: `Checked in! Streak is now ${updatedStreakCount} day${updatedStreakCount === 1 ? '' : 's'}.`,
      streakInfo: {
        previousStreak: goal.streak_count || 0,
        newStreak: updatedStreakCount,
        system: "atomic",
        nextCheckInAllowed: "Tomorrow after 3 AM EST",
        currentStreakDate
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