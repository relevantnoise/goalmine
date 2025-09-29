import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Keep the working expired goals logic
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
    console.log('[SIMPLE-EMAILS] Starting simplified daily email send process - FIXED VERSION 2.0');
    
    // Check for force delivery and reset parameters
    const { forceDelivery, resetToday } = req.method === 'POST' ? await req.json() : {};

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time
    const now = new Date();
    
    // KEEP PACIFIC/MIDWAY TIMEZONE SOLUTION (this works for 7 AM delivery)
    const midwayDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Midway'
    }).format(now);
    const todayDate = midwayDate;
    
    const easternTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
    
    const currentHour = parseInt(easternTime.split(':')[0]);
    
    console.log(`[SIMPLE-EMAILS] Pacific/Midway date: ${todayDate}`);
    console.log(`[SIMPLE-EMAILS] Current Eastern time: ${easternTime}`);

    // Keep delivery window check (simplified)
    const isProperDeliveryWindow = currentHour >= 7 && currentHour <= 10;
    if (!isProperDeliveryWindow && !forceDelivery) {
      console.log(`[SIMPLE-EMAILS] Outside delivery window (7-10 AM EDT), skipping.`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Outside delivery window. Current time: ${easternTime} EDT`,
          emailsSent: 0,
          errors: 0,
          skipped: true
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`[SIMPLE-EMAILS] ✅ Within delivery window, proceeding with email delivery`);

    // EMERGENCY RESET: Clear today's email dates if requested
    if (resetToday) {
      console.log(`[SIMPLE-EMAILS] 🚨 EMERGENCY RESET: Clearing last_motivation_date for today`);
      const { error: resetError } = await supabase
        .from('goals')
        .update({ last_motivation_date: null })
        .eq('is_active', true)
        .eq('last_motivation_date', todayDate);
      
      if (resetError) {
        console.error(`[SIMPLE-EMAILS] Reset failed:`, resetError);
      } else {
        console.log(`[SIMPLE-EMAILS] ✅ Reset completed - goals can now receive emails`);
      }
    }

    // SIMPLIFIED: Find goals that need emails (keep working hybrid architecture)
    const { data: candidateGoals, error: candidateError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${todayDate}`);

    if (candidateError) {
      console.error('[SIMPLE-EMAILS] Error fetching candidate goals:', candidateError);
      throw candidateError;
    }

    console.log(`[SIMPLE-EMAILS] Found ${candidateGoals?.length || 0} candidate goals`);
    
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

    // OPTION 1: Send all emails FIRST, then mark successful ones
    const successfulGoalIds = [];
    const emailResults = [];

    for (const goal of candidateGoals) {
      try {
        console.log(`[SIMPLE-EMAILS] Processing: "${goal.title}"`);
        
        // Get profile info (keep working hybrid lookup)
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
          console.error(`[SIMPLE-EMAILS] No email for goal: ${goal.title}`);
          emailResults.push({ goal: goal.title, status: 'error', reason: 'No email found' });
          continue;
        }

        // Check subscription (keep working logic)
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
        
        // Keep skip logic (working)
        const skipCheck = shouldSkipEmailForGoal(goal, profile, isSubscribed);
        if (skipCheck.skip) {
          console.log(`[SIMPLE-EMAILS] Skipping: ${skipCheck.reason}`);
          emailResults.push({ goal: goal.title, status: 'skipped', reason: skipCheck.reason });
          // Note: Skipped goals will be marked as processed at the end too
          successfulGoalIds.push(goal.id);
          continue;
        }

        // Generate AI content (keep working function)
        console.log(`[SIMPLE-EMAILS] Generating AI content for: ${goal.title}`);
        
        const aiResponse = await supabase.functions.invoke('generate-daily-motivation-simple', {
          body: {
            goalId: goal.id,
            goalTitle: goal.title,
            goalDescription: goal.description || '',
            tone: goal.tone || 'kind_encouraging',
            streakCount: goal.streak_count || 0,
            userId: goal.user_id
          }
        });

        let motivationContent;
        if (aiResponse.error || !aiResponse.data?.success) {
          console.log(`[SIMPLE-EMAILS] AI generation failed, using fallback for ${goal.title}`);
          motivationContent = {
            message: `Today is another opportunity to make progress on your goal: ${goal.title}. Keep building momentum!`,
            microPlan: ['Take one small action toward your goal today', 'Document your progress', 'Reflect on your progress'],
            challenge: 'Take 30 seconds to visualize achieving this goal.'
          };
        } else {
          motivationContent = {
            message: aiResponse.data.message,
            microPlan: aiResponse.data.microPlan,
            challenge: aiResponse.data.challenge
          };
        }

        console.log(`[SIMPLE-EMAILS] Sending email to: ${profile.email}`);
        
        // Send email (keep working function)
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

        // CRITICAL FIX: Check the actual success response, not just absence of error
        if (emailResponse.error || !emailResponse.data?.success) {
          const errorMsg = emailResponse.error?.message || emailResponse.data?.error || 'Email delivery failed';
          console.error(`[SIMPLE-EMAILS] ❌ Email failed for ${goal.title}:`, errorMsg);
          emailResults.push({ goal: goal.title, status: 'error', reason: errorMsg });
          // CRITICAL: Do NOT add to successfulGoalIds - goal will NOT be marked as processed
        } else {
          console.log(`[SIMPLE-EMAILS] ✅ Email sent for ${goal.title}:`, emailResponse.data);
          successfulGoalIds.push(goal.id);
          emailResults.push({ goal: goal.title, status: 'sent', email: profile.email });
        }

      } catch (error) {
        console.error(`[SIMPLE-EMAILS] Error processing ${goal.title}:`, error);
        emailResults.push({ goal: goal.title, status: 'error', reason: error.message });
      }
    }

    // OPTION 1: Mark ALL successful goals as processed AT ONCE
    let markedCount = 0;
    if (successfulGoalIds.length > 0) {
      console.log(`[SIMPLE-EMAILS] Marking ${successfulGoalIds.length} goals as processed`);
      
      const { error: markError } = await supabase
        .from('goals')
        .update({ last_motivation_date: todayDate })
        .in('id', successfulGoalIds);

      if (markError) {
        console.error(`[SIMPLE-EMAILS] Error marking goals as processed:`, markError);
      } else {
        markedCount = successfulGoalIds.length;
        console.log(`[SIMPLE-EMAILS] ✅ Successfully marked ${markedCount} goals as processed`);
      }
    }

    const emailsSent = emailResults.filter(r => r.status === 'sent').length;
    const errors = emailResults.filter(r => r.status === 'error').length;
    const skipped = emailResults.filter(r => r.status === 'skipped').length;

    console.log(`[SIMPLE-EMAILS] Complete. Sent: ${emailsSent}, Errors: ${errors}, Skipped: ${skipped}, Marked: ${markedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors,
        skipped,
        markedCount,
        results: emailResults,
        message: `Simplified email process completed. Sent ${emailsSent} emails, ${errors} errors, ${skipped} skipped.`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[SIMPLE-EMAILS] Fatal error:', error);
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