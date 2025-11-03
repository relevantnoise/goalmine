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
    const { goalId, userId } = body;

    console.log('🗑️ Deleting goal:', goalId, 'for user:', userId);
    console.log('🗑️ Request body received:', JSON.stringify(body));

    if (!goalId || !userId) {
      console.error('❌ Missing required fields:', { goalId, userId });
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields: goalId, userId"
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

    // Phase 5: Get goal and user profile for permission validation
    // Use hybrid architecture - try email first, then Firebase UID fallback
    let goal = null;
    let fetchError = null;

    // First try with email (current userId)
    const { data: goalByEmail, error: emailError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (goalByEmail) {
      goal = goalByEmail;
      console.log('✅ Goal found by email:', userId);
    } else {
      console.log('⚠️ Goal not found by email, trying Firebase UID...');
      
      // Get user profile to find Firebase UID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userId)
        .single();

      if (profile) {
        const firebaseUID = profile.id;
        console.log('🔍 Found Firebase UID:', firebaseUID, 'for email:', userId);
        
        const { data: goalByUID, error: uidError } = await supabase
          .from('goals')
          .select('*')
          .eq('id', goalId)
          .eq('user_id', firebaseUID)
          .single();

        if (goalByUID) {
          goal = goalByUID;
          console.log('✅ Goal found by Firebase UID:', firebaseUID);
        } else {
          fetchError = uidError;
          console.log('❌ Goal not found by either email or Firebase UID');
        }
      } else {
        fetchError = emailError;
        console.log('❌ Profile not found for email:', userId);
      }
    }

    if (!goal || fetchError) {
      console.error('❌ Error fetching goal:', fetchError);
      console.log('🔍 Query details - goalId:', goalId, 'userId:', userId);
      return new Response(JSON.stringify({
        success: false,
        error: fetchError?.message || "Goal not found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get user profile and subscription status  
    // We need the profile for the actual goal owner, not the requesting user
    const goalUserId = goal.user_id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', goalUserId)
      .single();

    const { data: subscription } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', profile?.email || goalUserId)
      .single();

    const isSubscribed = subscription?.status === 'active';

    // Phase 5: Check permissions before allowing delete
    const permissions = getGoalPermissions(goal, profile, isSubscribed);
    
    if (!permissions.canDelete) {
      const trialExpired = isTrialExpired(profile);
      
      let message = "Delete not allowed.";
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

    // First, delete related motivation_history records (foreign key constraint)
    console.log('🗑️ Deleting motivation history for goal:', goalId);
    const { error: motivationError } = await supabase
      .from('motivation_history')
      .delete()
      .eq('goal_id', goalId)
      .eq('user_id', goalUserId);

    if (motivationError) {
      console.error('❌ Error deleting motivation history:', motivationError);
      // Continue anyway - motivation history might not exist
    }

    // Delete the goal using service role
    console.log('🗑️ Deleting goal from database:', goalId);
    const { data, error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', goalUserId)
      .select()
      .single();

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

    console.log('✅ Goal deleted successfully:', goalId);

    return new Response(JSON.stringify({
      success: true,
      deletedGoal: data,
      message: "Goal deleted successfully"
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