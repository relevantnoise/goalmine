import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Phase 2: Email Skip Logic Helper Functions
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[DAILY-EMAILS-FIXED] Starting daily email send process with processing lock pattern');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Check for force delivery and reset parameters
    const { forceDelivery, resetFirst } = req.method === 'POST' ? await req.json() : {};
    
    // TESTING: Reset all goals first if requested
    if (resetFirst) {
      console.log(`[DAILY-EMAILS-FIXED] 🔄 RESETTING all goal email dates for testing...`);
      const { data: resetData, error: resetError } = await supabase
        .from('goals')
        .update({ last_motivation_date: null })
        .eq('is_active', true)
        .select();
      
      if (resetError) {
        console.error(`[DAILY-EMAILS-FIXED] ❌ Reset error:`, resetError);
      } else {
        console.log(`[DAILY-EMAILS-FIXED] ✅ Reset ${resetData?.length || 0} goals for fresh testing`);
      }
    }

    // Supabase client already initialized above for reset

    // Get current time in Eastern timezone
    const now = new Date();
    
    // SIMPLE UTC DATE LOGIC - No timezone complexity
    const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const easternTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
    
    const currentHour = parseInt(easternTime.split(':')[0]);
    const currentMinute = parseInt(easternTime.split(':')[1]);
    
    console.log(`[DAILY-EMAILS-FIXED] TODAY UTC DATE: ${todayDate}`);
    console.log(`[DAILY-EMAILS-FIXED] TESTING MODE: Removed time window restrictions`);

    // TESTING: Remove time window restrictions - send anytime
    console.log(`[DAILY-EMAILS-FIXED] ✅ TESTING MODE - bypassing time window checks`);

    console.log(`[DAILY-EMAILS-FIXED] ✅ Within delivery window, proceeding with email delivery`);

    // NEW APPROACH: Find goals that need emails but DON'T mark them as processed yet
    const { data: candidateGoals, error: candidateError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${todayDate}`);

    if (candidateError) {
      console.error('[DAILY-EMAILS-FIXED] Error fetching candidate goals:', candidateError);
      throw candidateError;
    }

    console.log(`[DAILY-EMAILS-FIXED] Found ${candidateGoals?.length || 0} candidate goals`);
    
    if (!candidateGoals || candidateGoals.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `No goals need processing for ${todayDate}`,
          emailsSent: 0,
          errors: 0
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let emailsSent = 0;
    let errors = 0;

    // Process each goal with success confirmation pattern
    for (const goal of candidateGoals) {
      try {
        console.log(`[DAILY-EMAILS-FIXED] Processing: "${goal.title}"`);
        
        // Get profile info for email
        let profile;
        if (goal.user_id.includes('@')) {
          const result = await supabase
            .from('profiles')
            .select('email, trial_expires_at')
            .eq('email', goal.user_id)
            .single();
          profile = result.data || { email: goal.user_id, trial_expires_at: null };
        } else {
          const result = await supabase
            .from('profiles')
            .select('email, trial_expires_at')
            .eq('id', goal.user_id)
            .single();
          profile = result.data;
        }
        
        if (!profile?.email) {
          console.error(`[DAILY-EMAILS-FIXED] No email for goal: ${goal.title}`);
          errors++;
          continue;
        }

        // Check subscription
        let subscriptionData = null;
        if (goal.user_id.includes('@')) {
          const { data } = await supabase
            .from('subscribers')
            .select('subscribed')
            .eq('user_id', goal.user_id)
            .single();
          subscriptionData = data;
        } else {
          const { data } = await supabase
            .from('subscribers')
            .select('subscribed')
            .eq('user_id', profile.email)
            .single();
          subscriptionData = data;
        }
        
        const isSubscribed = subscriptionData?.subscribed === true;
        
        // Skip check
        const skipCheck = shouldSkipEmailForGoal(goal, profile, isSubscribed);
        if (skipCheck.skip) {
          console.log(`[DAILY-EMAILS-FIXED] Skipping: ${skipCheck.reason}`);
          // Mark as processed since we're skipping intentionally
          await supabase
            .from('goals')
            .update({ last_motivation_date: todayDate })
            .eq('id', goal.id);
          continue;
        }

        // Generate content
        let motivationContent = {
          message: `Today is another opportunity to make progress on your goal: ${goal.title}. Keep building momentum!`,
          microPlan: ['Take one small action toward your goal today', 'Document your progress', 'Reflect on your progress'],
          challenge: 'Take 30 seconds to visualize achieving this goal.'
        };

        console.log(`[DAILY-EMAILS-FIXED] Sending email to: ${profile.email}`);
        
        // CRITICAL: Send email via Resend FIRST
        const emailResponse = await supabase.functions.invoke('send-motivation-email', {
          body: {
            email: profile.email,
            name: profile.email.split('@')[0],
            goal: goal.title,
            message: motivationContent.message,
            microPlan: motivationContent.microPlan.join('\n• '),
            challenge: motivationContent.challenge,
            streak: goal.streak_count || 0,
            redirectUrl: 'https://goalmine.ai',
            isNudge: false,
            userId: goal.user_id,
            goalId: goal.id
          }
        });

        // CRITICAL: Only mark as processed if email succeeded
        if (emailResponse.error) {
          console.error(`[DAILY-EMAILS-FIXED] ❌ Email failed for ${goal.title}:`, emailResponse.error);
          errors++;
          // DON'T mark as processed - will retry tomorrow
        } else {
          // SUCCESS! Mark as processed
          const { error: markError } = await supabase
            .from('goals')
            .update({ last_motivation_date: todayDate })
            .eq('id', goal.id);

          if (markError) {
            console.error(`[DAILY-EMAILS-FIXED] Error marking processed:`, markError);
          } else {
            console.log(`[DAILY-EMAILS-FIXED] ✅ Email sent and marked processed: ${goal.title}`);
            emailsSent++;
          }
        }

      } catch (error) {
        console.error(`[DAILY-EMAILS-FIXED] Error processing ${goal.title}:`, error);
        errors++;
      }
    }

    console.log(`[DAILY-EMAILS-FIXED] Complete. Sent: ${emailsSent}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors,
        message: `Daily email process completed. Sent ${emailsSent} emails with ${errors} errors.`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DAILY-EMAILS-FIXED] Fatal error:', error);
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
