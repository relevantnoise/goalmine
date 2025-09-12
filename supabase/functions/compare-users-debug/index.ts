import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (isTrialExpired(profile) && !isSubscribed) {
    return { skip: true, reason: 'Trial expired and user not subscribed' };
  }
  
  if (isGoalExpired(goal)) {
    return { skip: true, reason: 'Goal has reached its target date' };
  }
  
  return { skip: false, reason: 'Goal is active and eligible for emails' };
}

async function analyzeUser(supabase: any, userId: string) {
  console.log(`[COMPARE] Analyzing user: ${userId}`);
  const today = new Date().toISOString().split('T')[0];
  
  // Get user profile
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', userId)
    .maybeSingle();

  console.log(`[COMPARE] ${userId} profile:`, userProfile);
  
  // Get email-based goals
  const { data: emailGoals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  // Get Firebase UID-based goals
  let firebaseGoals = [];
  if (userProfile?.id) {
    const { data: uidGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userProfile.id)
      .eq('is_active', true);
    firebaseGoals = uidGoals || [];
  }

  const allGoals = [...(emailGoals || []), ...firebaseGoals];
  console.log(`[COMPARE] ${userId} goals:`, allGoals.map(g => ({ id: g.id, title: g.title, user_id: g.user_id, last_motivation_date: g.last_motivation_date })));

  // Check subscription - HYBRID approach
  let subscriptionData = null;
  
  // Direct email lookup
  const { data: emailSub } = await supabase
    .from('subscribers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (emailSub) {
    subscriptionData = emailSub;
  } else if (userProfile?.email) {
    // Fallback lookup
    const { data: profileSub } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userProfile.email)
      .maybeSingle();
    subscriptionData = profileSub;
  }

  const isSubscribed = subscriptionData && subscriptionData.subscribed === true;
  console.log(`[COMPARE] ${userId} subscription:`, { subscriptionData, isSubscribed });

  // Check eligibility according to send-daily-emails logic
  const eligibleGoals = [];
  const skippedGoals = [];
  
  // First filter: goals that haven't been processed today
  const unprocessedGoals = allGoals.filter(g => 
    !g.last_motivation_date || g.last_motivation_date < today
  );
  
  console.log(`[COMPARE] ${userId} unprocessed goals:`, unprocessedGoals.length);
  
  // Second filter: skip logic
  for (const goal of unprocessedGoals) {
    const skipCheck = shouldSkipEmailForGoal(goal, userProfile, isSubscribed);
    if (skipCheck.skip) {
      skippedGoals.push({ goal: goal.title, reason: skipCheck.reason });
    } else {
      eligibleGoals.push(goal);
    }
  }

  return {
    userId,
    profile: userProfile,
    totalActiveGoals: allGoals.length,
    emailBasedGoals: emailGoals?.length || 0,
    firebaseUidGoals: firebaseGoals.length,
    unprocessedToday: unprocessedGoals.length,
    eligible: eligibleGoals.length,
    skipped: skippedGoals,
    subscription: {
      exists: !!subscriptionData,
      subscribed: isSubscribed,
      details: subscriptionData
    },
    trial: {
      expired: isTrialExpired(userProfile),
      expiresAt: userProfile?.trial_expires_at
    },
    goalDetails: allGoals.map(g => ({
      id: g.id,
      title: g.title,
      userIdType: g.user_id.includes('@') ? 'email' : 'firebase_uid',
      user_id: g.user_id,
      last_motivation_date: g.last_motivation_date,
      target_date: g.target_date,
      expired: isGoalExpired(g)
    }))
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[COMPARE] Starting user comparison');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Analyze both users
    const danlynn = await analyzeUser(supabase, 'danlynn@gmail.com');
    const dandlynn = await analyzeUser(supabase, 'dandlynn@yahoo.com');

    const comparison = {
      date: new Date().toISOString().split('T')[0],
      users: {
        'danlynn@gmail.com': danlynn,
        'dandlynn@yahoo.com': dandlynn
      },
      differences: {
        profileExists: {
          danlynn: !!danlynn.profile,
          dandlynn: !!dandlynn.profile
        },
        totalGoals: {
          danlynn: danlynn.totalActiveGoals,
          dandlynn: dandlynn.totalActiveGoals
        },
        eligibleForEmail: {
          danlynn: danlynn.eligible,
          dandlynn: dandlynn.eligible
        },
        subscriptionStatus: {
          danlynn: danlynn.subscription.subscribed,
          dandlynn: dandlynn.subscription.subscribed
        },
        trialExpired: {
          danlynn: danlynn.trial.expired,
          dandlynn: dandlynn.trial.expired
        }
      },
      analysis: {
        whyDanlynnGetsEmails: danlynn.eligible > 0 ? 'Has eligible goals' : 'No eligible goals',
        whyDandlynnDoesntGetEmails: dandlynn.eligible === 0 ? 
          (dandlynn.skipped.length > 0 ? `All goals skipped: ${dandlynn.skipped.map(s => s.reason).join(', ')}` : 'No active goals or all processed today') : 
          'Should get emails - investigate further'
      }
    };

    console.log('[COMPARE] Comparison complete:', comparison);

    return new Response(
      JSON.stringify(comparison, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[COMPARE] Error:', error);
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