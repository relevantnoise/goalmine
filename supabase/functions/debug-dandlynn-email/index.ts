import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper functions from send-daily-emails
function isGoalExpired(goal: any): boolean {
  if (!goal.target_date) return false;
  const targetDate = new Date(goal.target_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return targetDate < today;
}

function isTrialExpired(profile: any): boolean {
  if (!profile || !profile.trial_expires_at) return false;
  return new Date(profile.trial_expires_at) < new Date();
}

function shouldSkipEmailForGoal(goal: any, profile: any, isSubscribed: boolean): { skip: boolean; reason: string } {
  // Check if trial expired and not subscribed
  if (isTrialExpired(profile) && !isSubscribed) {
    return { skip: true, reason: 'Trial expired and user not subscribed' };
  }
  
  // Check if goal is expired
  if (isGoalExpired(goal)) {
    return { skip: true, reason: 'Goal has reached its target date' };
  }
  
  return { skip: false, reason: 'Goal is active and eligible for emails' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const userId = 'dandlynn@yahoo.com'
    const today = new Date().toISOString().split('T')[0]
    
    console.log(`=== DEBUGGING EMAIL FOR ${userId} ===`)
    console.log(`Today: ${today}`)

    // Get goals that need motivation
    const { data: goals, error: goalsError } = await supabaseClient
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${today}`)

    console.log(`Total goals needing motivation: ${goals?.length || 0}`)
    
    const dandlynnGoals = goals?.filter(g => 
      g.user_id === userId || g.user_id === 's7LOUJx5zSSWWP2ogg7r6sqHSqF3'
    ) || []
    
    console.log(`dandlynn@yahoo.com goals: ${dandlynnGoals.length}`)

    const results = []

    for (const goal of dandlynnGoals) {
      console.log(`\n--- Processing goal: ${goal.title} ---`)
      console.log(`Goal user_id: ${goal.user_id}`)
      console.log(`Goal last_motivation_date: ${goal.last_motivation_date}`)
      
      // HYBRID profile lookup
      let userProfile = null;
      let profileError = null;
      
      if (goal.user_id.includes('@')) {
        console.log(`Email-based goal - looking up profile by email: ${goal.user_id}`);
        const result = await supabaseClient
          .from('profiles')
          .select('email, trial_expires_at, created_at')
          .eq('email', goal.user_id)
          .single();
        userProfile = result.data;
        profileError = result.error;
      } else {
        console.log(`Firebase UID-based goal - looking up profile by ID: ${goal.user_id}`);
        const result = await supabaseClient
          .from('profiles')
          .select('email, trial_expires_at, created_at')
          .eq('id', goal.user_id)
          .single();
        userProfile = result.data;
        profileError = result.error;
      }

      console.log(`Profile lookup result:`, { userProfile, profileError });

      // Profile handling
      let profile;
      if (userProfile) {
        profile = userProfile;
      } else if (goal.user_id.includes('@')) {
        profile = { email: goal.user_id, trial_expires_at: null };
      } else {
        console.error(`No profile found for Firebase UID goal ${goal.title}: ${goal.user_id}`);
        results.push({
          goal: goal.title,
          status: 'ERROR',
          reason: 'No profile found for Firebase UID goal'
        })
        continue;
      }
      
      console.log(`Final profile:`, profile);

      // Check subscription
      let subscriptionData = null;
      
      if (goal.user_id.includes('@')) {
        const { data } = await supabaseClient
          .from('subscribers')
          .select('subscribed, subscription_tier, email')
          .eq('user_id', goal.user_id)
          .single();
        subscriptionData = data;
      } else {
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('email')
          .eq('id', goal.user_id)
          .single();
        
        if (profileData?.email) {
          const { data } = await supabaseClient
            .from('subscribers')
            .select('subscribed, subscription_tier, email')
            .eq('user_id', profileData.email)
            .single();
          subscriptionData = data;
        }
      }
      
      const isSubscribed = subscriptionData && subscriptionData.subscribed === true;
      
      console.log(`Subscription data:`, subscriptionData);
      console.log(`Is subscribed:`, isSubscribed);

      // Check eligibility
      const trialExpired = isTrialExpired(profile);
      const goalExpired = isGoalExpired(goal);
      
      console.log(`Trial expired:`, trialExpired);
      console.log(`Goal expired:`, goalExpired);
      console.log(`Trial expires at:`, profile.trial_expires_at);
      console.log(`Goal target date:`, goal.target_date);

      const skipCheck = shouldSkipEmailForGoal(goal, profile, isSubscribed);
      
      console.log(`Skip check:`, skipCheck);

      results.push({
        goal: goal.title,
        user_id: goal.user_id,
        last_motivation_date: goal.last_motivation_date,
        profile: profile,
        subscription: subscriptionData,
        isSubscribed: isSubscribed,
        trialExpired: trialExpired,
        goalExpired: goalExpired,
        skipCheck: skipCheck,
        wouldSendEmail: !skipCheck.skip
      })
    }

    return new Response(
      JSON.stringify({
        debug_user: userId,
        today: today,
        total_goals_needing_motivation: goals?.length || 0,
        dandlynn_goals_found: dandlynnGoals.length,
        results: results,
        timestamp: new Date().toISOString()
      }, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})