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
    console.log('[DAILY-EMAILS-AGGRESSIVE-FIX-v2] Starting daily email send with FORCED deployment and 7:20 PM testing');
    
    // Check for force delivery parameter
    const { forceDelivery } = req.method === 'POST' ? await req.json() : {};

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time and use SIMPLE UTC date for consistency
    const now = new Date();
    
    // FINAL FIX: Use UTC date for both query and marking (eliminates timezone complexity)
    const todayDate = now.toISOString().split('T')[0];
    
    const easternTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
    
    const currentHour = parseInt(easternTime.split(':')[0]);
    const currentMinute = parseInt(easternTime.split(':')[1]);
    
    console.log(`[DAILY-EMAILS-FINAL] UTC date: ${todayDate}`);
    console.log(`[DAILY-EMAILS-FINAL] Current Eastern time: ${easternTime} (${currentHour}:${currentMinute})`);

    // PRODUCTION: Check if we're in the proper delivery window (optional for forceDelivery)
    const isProperDeliveryWindow = forceDelivery || (currentHour >= 6 && currentHour <= 10); // 6-10 AM EDT window
    
    if (!isProperDeliveryWindow) {
      console.log(`[DAILY-EMAILS] Outside delivery window (${currentHour}:${currentMinute} EDT). Daily emails only send 6-10 AM EDT.`);
      return new Response(JSON.stringify({
        success: true,
        message: `Outside delivery window (${currentHour}:${currentMinute} EDT). Daily emails only send 6-10 AM EDT.`,
        emailsSent: 0,
        errors: 0,
        skipped: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[DAILY-EMAILS] ✅ Within delivery window (${currentHour}:${currentMinute} EDT), proceeding with email processing`);

    // Query goals that need processing (last_motivation_date is null OR less than today's UTC date)
    console.log(`[DAILY-EMAILS] Querying goals that need processing for ${todayDate}`);
    
    const { data: candidateGoals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${todayDate}`);

    if (error) {
      console.error('[DAILY-EMAILS] Error fetching goals:', error);
      throw error;
    }

    console.log(`[DAILY-EMAILS] Found ${candidateGoals?.length || 0} goals that need processing`);
    
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

        // Check for pre-generated content first
        console.log(`[DAILY-EMAILS] Checking for pre-generated content for: ${goal.title}`);
        
        const today = new Date().toISOString().split('T')[0];
        const todayStart = new Date(today + 'T00:00:00.000Z').toISOString();
        const todayEnd = new Date(today + 'T23:59:59.999Z').toISOString();
        
        const { data: preGeneratedContent } = await supabase
          .from('motivation_history')
          .select('message, micro_plan, challenge')
          .eq('goal_id', goal.id)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .order('created_at', { ascending: false })
          .limit(1);

        let aiResponse;
        if (preGeneratedContent && preGeneratedContent.length > 0) {
          console.log(`[DAILY-EMAILS] ✅ Using pre-generated content for: ${goal.title}`);
          aiResponse = {
            data: {
              success: true,
              message: preGeneratedContent[0].message,
              microPlan: preGeneratedContent[0].micro_plan,
              challenge: preGeneratedContent[0].challenge
            }
          };
        } else {
          console.log(`[DAILY-EMAILS] No pre-generated content found, generating real-time for: ${goal.title}`);
          aiResponse = await supabase.functions.invoke('generate-daily-motivation', {
            body: {
              goalId: goal.id,
              goalTitle: goal.title,
              goalDescription: goal.description || '',
              tone: goal.tone || 'kind_encouraging',
              streakCount: goal.streak_count || 0,
              userId: goal.user_id,
              isNudge: false,
              targetDate: goal.target_date
            }
          });
        }

        let motivationContent;
        if (aiResponse.error || !aiResponse.data?.success) {
          console.log(`[DAILY-EMAILS] AI generation failed for ${goal.title}`);
          console.log(`[DAILY-EMAILS] Error:`, aiResponse.error);
          console.log(`[DAILY-EMAILS] Data:`, aiResponse.data);
          console.log(`[DAILY-EMAILS] Full response:`, aiResponse);
          motivationContent = {
            message: `Today is another opportunity to make progress on your goal: ${goal.title}. Keep building momentum!`,
            microPlan: ['Take one small action toward your goal today', 'Document your progress', 'Reflect on your progress'],
            challenge: 'Take 30 seconds to visualize achieving this goal.'
          };
        } else {
          console.log(`[DAILY-EMAILS] ✅ AI content generated for ${goal.title}`);
          motivationContent = {
            message: aiResponse.data.message,
            microPlan: aiResponse.data.microPlan,
            challenge: aiResponse.data.challenge
          };
        }

        console.log(`[DAILY-EMAILS-FIXED] Sending email to: ${profile.email}`);
        
        // CRITICAL: Send email via Resend FIRST
        const emailResponse = await supabase.functions.invoke('send-motivation-email', {
          body: {
            email: profile.email,
            name: profile.email.split('@')[0],
            goal: goal.title,
            message: motivationContent.message,
            microPlan: motivationContent.microPlan, // Send as array - email template handles both formats
            challenge: motivationContent.challenge,
            streak: goal.streak_count || 0,
            redirectUrl: 'https://goalmine.ai',
            isNudge: false,
            userId: goal.user_id,
            goalId: goal.id
          }
        });

        // BULLETPROOF: Only mark as processed if Resend confirmed successful delivery
        if (emailResponse.error || !emailResponse.data?.success) {
          console.error(`[DAILY-EMAILS-FINAL] ❌ Email failed for ${goal.title}:`, emailResponse.error || 'No success confirmation');
          errors++;
          // DON'T mark as processed - will retry tomorrow automatically
        } else {
          // CONFIRMED SUCCESS! Mark as processed only after Resend confirmation
          const { error: markError } = await supabase
            .from('goals')
            .update({ last_motivation_date: todayDate })
            .eq('id', goal.id);

          if (markError) {
            console.error(`[DAILY-EMAILS-FINAL] Error marking processed:`, markError);
            errors++; // Count as error since goal wasn't marked
          } else {
            console.log(`[DAILY-EMAILS-FINAL] ✅ Email sent and confirmed by Resend, marked processed: ${goal.title}`);
            emailsSent++;
          }
        }

      } catch (error) {
        console.error(`[DAILY-EMAILS-FINAL] Error processing ${goal.title}:`, error);
        errors++;
      }
    }

    console.log(`[DAILY-EMAILS-FINAL] Complete. Sent: ${emailsSent}, Errors: ${errors}`);

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
