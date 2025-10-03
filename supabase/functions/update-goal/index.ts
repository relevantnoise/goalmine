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
    const body = await req.json();
    const { goalId, userId, updates } = body;

    console.log('🔄 Updating goal:', goalId, 'for user:', userId, 'with updates:', updates);

    if (!goalId || !userId || !updates) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields: goalId, userId, updates"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // HYBRID: Find goal using both email AND Firebase UID approaches
    console.log('🔍 HYBRID: Looking for goal using both email and Firebase UID approaches');
    
    // First, try to get profile to find Firebase UID
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userId);
    
    const userProfile = userProfiles && userProfiles.length > 0 ? userProfiles[0] : null;

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

    if (!goal || fetchError) {
      return new Response(JSON.stringify({
        success: false,
        error: fetchError?.message || 'Goal not found'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Get user profile and subscription status (use email lookup)
    const { data: profileResults } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userId);
    
    const profile = profileResults && profileResults.length > 0 ? profileResults[0] : null;

    const { data: subscriptionResults } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userProfile?.id || userId);
    
    const subscription = subscriptionResults && subscriptionResults.length > 0 ? subscriptionResults[0] : null;

    const isSubscribed = subscription?.status === 'active';

    // Phase 5: Check permissions before allowing update
    const permissions = getGoalPermissions(goal, profile, isSubscribed);
    
    if (!permissions.canEdit) {
      const trialExpired = isTrialExpired(profile);
      
      let message = "Edit not allowed.";
      if (trialExpired && !isSubscribed) {
        message = "Your 30-day free trial has expired. Please upgrade to manage your goals.";
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: message,
        permissions: permissions,
        needsUpgrade: trialExpired && !isSubscribed
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Update the goal using service role (use the actual goal's user_id)
    console.log('🔄 Attempting to update goal:', { goalId, user_id: goal.user_id, updates });
    
    // Clean and validate the updates object
    const cleanUpdates: any = {};
    
    // Only include valid fields to avoid data type issues
    if (updates.title !== undefined) cleanUpdates.title = String(updates.title);
    if (updates.description !== undefined) cleanUpdates.description = updates.description ? String(updates.description) : null;
    if (updates.target_date !== undefined) {
      // Ensure target_date is in proper YYYY-MM-DD format
      if (updates.target_date) {
        const dateStr = String(updates.target_date);
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          cleanUpdates.target_date = dateStr;
        } else {
          console.error('❌ Invalid date format:', dateStr);
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid date format. Expected YYYY-MM-DD.'
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
      } else {
        cleanUpdates.target_date = null;
      }
    }
    if (updates.tone !== undefined) cleanUpdates.tone = String(updates.tone);
    if (updates.time_of_day !== undefined) cleanUpdates.time_of_day = String(updates.time_of_day);
    
    cleanUpdates.updated_at = new Date().toISOString();
    
    console.log('🧹 Cleaned updates:', cleanUpdates);
    
    const { data: updateResults, error } = await supabase
      .from('goals')
      .update(cleanUpdates)
      .eq('id', goalId)
      .eq('user_id', goal.user_id)  // Use the actual user_id from the found goal
      .select();
    
    console.log('🔍 Update query results:', { updateResults, error });
    
    if (error) {
      console.error('❌ Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    if (!updateResults || updateResults.length === 0) {
      console.error('❌ No rows updated - goal not found or permission denied');
      return new Response(JSON.stringify({
        success: false,
        error: 'Goal not found or permission denied'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const data = updateResults[0];

    console.log('✅ Goal updated successfully:', data.id);

    return new Response(JSON.stringify({
      success: true,
      goal: data
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Unknown error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});