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
    console.log('[ROBUST-EMAIL] Starting robust daily email send process');
    
    // Check for force delivery parameter
    const { forceDelivery } = req.method === 'POST' ? await req.json() : {};

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time in Eastern timezone
    const now = new Date();
    
    // Use Pacific/Midway timezone for date calculation (existing fix)
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
    
    console.log(`[ROBUST-EMAIL] Pacific/Midway date: ${todayDate}`);
    console.log(`[ROBUST-EMAIL] Current Eastern time: ${easternTime} (${currentHour}:xx)`);

    // Check delivery window (keep existing logic)
    const isProperDeliveryWindow = currentHour >= 7 && currentHour <= 10;
    if (!isProperDeliveryWindow && !forceDelivery) {
      console.log(`[ROBUST-EMAIL] Outside delivery window, skipping.`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Outside delivery window. Daily emails only send 7-10 AM EDT.`,
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

    console.log(`[ROBUST-EMAIL] ✅ Within delivery window, proceeding with email delivery`);

    // ROBUST APPROACH: Find goals that need emails
    const { data: candidateGoals, error: candidateError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${todayDate}`);

    if (candidateError) {
      console.error('[ROBUST-EMAIL] Error fetching candidate goals:', candidateError);
      throw candidateError;
    }

    console.log(`[ROBUST-EMAIL] Found ${candidateGoals?.length || 0} candidate goals`);
    
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
    const deliveryLog = [];

    // Process each goal with ROBUST success confirmation
    for (const goal of candidateGoals) {
      try {
        console.log(`[ROBUST-EMAIL] Processing: "${goal.title}"`);
        
        // Log attempt BEFORE any processing
        const logEntry = {
          goal_id: goal.id,
          goal_title: goal.title,
          user_id: goal.user_id,
          attempted_at: new Date().toISOString(),
          status: 'attempting'
        };
        
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
          console.error(`[ROBUST-EMAIL] No email for goal: ${goal.title}`);
          logEntry.status = 'failed';
          logEntry.error = 'No email address found';
          deliveryLog.push(logEntry);
          errors++;
          continue;
        }

        logEntry.user_email = profile.email;

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
          console.log(`[ROBUST-EMAIL] Skipping: ${skipCheck.reason}`);
          logEntry.status = 'skipped';
          logEntry.error = skipCheck.reason;
          deliveryLog.push(logEntry);
          
          // Mark as processed since we're skipping intentionally
          await supabase
            .from('goals')
            .update({ last_motivation_date: todayDate })
            .eq('id', goal.id);
          continue;
        }

        // Generate AI-powered content for this goal
        console.log(`[ROBUST-EMAIL] Generating AI content for goal: ${goal.title} (tone: ${goal.tone})`);
        
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
          console.error(`[ROBUST-EMAIL] AI generation failed for ${goal.title}, using fallback:`, aiResponse.error);
          // Fallback to static content if AI fails
          motivationContent = {
            message: `Today is another opportunity to make progress on your goal: ${goal.title}. Keep building momentum!`,
            microPlan: ['Take one small action toward your goal today', 'Document your progress', 'Reflect on your progress'],
            challenge: 'Take 30 seconds to visualize achieving this goal.'
          };
        } else {
          console.log(`[ROBUST-EMAIL] ✅ AI content generated for ${goal.title}`);
          motivationContent = {
            message: aiResponse.data.message,
            microPlan: aiResponse.data.microPlan,
            challenge: aiResponse.data.challenge
          };
        }

        console.log(`[ROBUST-EMAIL] Sending email to: ${profile.email}`);
        
        // CRITICAL: Send email via Resend with ROBUST response validation
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

        console.log(`[ROBUST-EMAIL] Email response for ${goal.title}:`, emailResponse);

        // ROBUST SUCCESS VALIDATION
        let emailSucceeded = false;
        let resendId = null;
        let errorMessage = null;

        if (emailResponse.error) {
          errorMessage = `Supabase function error: ${emailResponse.error.message}`;
        } else if (!emailResponse.data) {
          errorMessage = 'No response data from email function';
        } else if (emailResponse.data.error) {
          errorMessage = `Email service error: ${emailResponse.data.error}`;
        } else if (emailResponse.data.success && emailResponse.data.messageId) {
          // SUCCESS: We have a Resend message ID
          emailSucceeded = true;
          resendId = emailResponse.data.messageId;
        } else {
          errorMessage = 'Email function returned success but no message ID';
        }

        // Update log entry
        logEntry.status = emailSucceeded ? 'sent' : 'failed';
        logEntry.resend_id = resendId;
        logEntry.error = errorMessage;
        deliveryLog.push(logEntry);

        // CRITICAL: Only mark as processed if we have PROOF of success
        if (emailSucceeded && resendId) {
          const { error: markError } = await supabase
            .from('goals')
            .update({ last_motivation_date: todayDate })
            .eq('id', goal.id);

          if (markError) {
            console.error(`[ROBUST-EMAIL] Error marking processed:`, markError);
            logEntry.status = 'sent_but_not_marked';
            logEntry.error = `Marked as sent but database update failed: ${markError.message}`;
          } else {
            console.log(`[ROBUST-EMAIL] ✅ Email sent and confirmed: ${goal.title} (Resend ID: ${resendId})`);
            emailsSent++;
          }
        } else {
          console.error(`[ROBUST-EMAIL] ❌ Email failed for ${goal.title}: ${errorMessage}`);
          errors++;
          // DON'T mark as processed - will retry tomorrow
        }

      } catch (error) {
        console.error(`[ROBUST-EMAIL] Error processing ${goal.title}:`, error);
        deliveryLog.push({
          goal_id: goal.id,
          goal_title: goal.title,
          user_id: goal.user_id,
          attempted_at: new Date().toISOString(),
          status: 'failed',
          error: error.message
        });
        errors++;
      }
    }

    console.log(`[ROBUST-EMAIL] Complete. Sent: ${emailsSent}, Errors: ${errors}`);
    console.log(`[ROBUST-EMAIL] Delivery log:`, deliveryLog);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors,
        deliveryLog,
        message: `Robust email process completed. Sent ${emailsSent} emails with ${errors} errors.`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[ROBUST-EMAIL] Fatal error:', error);
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