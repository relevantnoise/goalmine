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
    console.log('🚀 [EMAIL-DELIVERY] BULLETPROOF Email System Starting');
    console.log('🚀 [EMAIL-DELIVERY] Stage 2: Send emails using pre-generated content ONLY');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    
    const easternTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
    
    const currentHour = parseInt(easternTime.split(':')[0]);
    const currentMinute = parseInt(easternTime.split(':')[1]);
    
    console.log(`[EMAIL-DELIVERY] UTC date: ${todayDate}`);
    console.log(`[EMAIL-DELIVERY] Current Eastern time: ${easternTime} (${currentHour}:${currentMinute})`);

    // Check for force delivery parameter
    const { forceDelivery } = req.method === 'POST' ? await req.json() : {};

    // PRODUCTION: Check if we're in the proper delivery window (optional for forceDelivery)
    const isProperDeliveryWindow = forceDelivery || (currentHour >= 6 && currentHour <= 10); // 6-10 AM EDT window
    
    if (!isProperDeliveryWindow) {
      console.log(`[EMAIL-DELIVERY] Outside delivery window (${currentHour}:${currentMinute} EDT). Daily emails only send 6-10 AM EDT.`);
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

    console.log(`[EMAIL-DELIVERY] ✅ Within delivery window (${currentHour}:${currentMinute} EDT), proceeding with email delivery`);

    // Get goals that need email delivery (have NOT been processed for email today)
    console.log(`[EMAIL-DELIVERY] Querying goals with pre-generated content for ${todayDate}`);
    
    const todayStart = new Date(todayDate + 'T00:00:00.000Z').toISOString();
    const todayEnd = new Date(todayDate + 'T23:59:59.999Z').toISOString();
    
    // CRITICAL: Only get goals that have motivation content for today AND haven't been emailed yet
    const { data: goalsWithContent, error: contentError } = await supabase
      .from('motivation_history')
      .select(`
        goal_id,
        message,
        micro_plan,
        challenge,
        goals (
          id,
          user_id,
          title,
          description,
          tone,
          streak_count,
          is_active,
          last_motivation_date,
          target_date
        )
      `)
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);

    if (contentError) {
      console.error('[EMAIL-DELIVERY] Error fetching content:', contentError);
      throw contentError;
    }

    console.log(`[EMAIL-DELIVERY] Found ${goalsWithContent?.length || 0} goals with pre-generated content`);
    
    if (!goalsWithContent || goalsWithContent.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `No goals with pre-generated content found for ${todayDate}`,
          emailsSent: 0,
          errors: 0,
          note: 'Content generation may not have run yet'
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Filter out goals that have already been emailed today
    const candidateGoals = goalsWithContent.filter(item => {
      const goal = item.goals;
      return goal && 
             goal.is_active && 
             goal.last_motivation_date !== todayDate; // Haven't been emailed today
    });

    console.log(`[EMAIL-DELIVERY] ${candidateGoals.length} goals need email delivery (${goalsWithContent.length - candidateGoals.length} already processed)`);

    if (candidateGoals.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `All goals with content have already been emailed today`,
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

    // Process each goal with pre-generated content
    for (const contentItem of candidateGoals) {
      try {
        const goal = contentItem.goals;
        console.log(`[EMAIL-DELIVERY] Processing: "${goal.title}"`);
        
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
          console.error(`[EMAIL-DELIVERY] No email for goal: ${goal.title}`);
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
          console.log(`[EMAIL-DELIVERY] Skipping: ${skipCheck.reason}`);
          // Mark as processed since we're skipping intentionally
          await supabase
            .from('goals')
            .update({ last_motivation_date: todayDate })
            .eq('id', goal.id);
          continue;
        }

        // Use the pre-generated content (NO AI generation here!)
        const motivationContent = {
          message: contentItem.message,
          microPlan: Array.isArray(contentItem.micro_plan) ? contentItem.micro_plan : [contentItem.micro_plan].filter(Boolean),
          challenge: contentItem.challenge
        };

        console.log(`[EMAIL-DELIVERY] Sending email to: ${profile.email}`);
        
        // Send email via Resend using pre-generated content
        const emailResponse = await supabase.functions.invoke('send-motivation-email', {
          body: {
            email: profile.email,
            name: profile.email.split('@')[0],
            goal: goal.title,
            message: motivationContent.message,
            microPlan: motivationContent.microPlan,
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
          console.error(`[EMAIL-DELIVERY] ❌ Email failed for ${goal.title}:`, emailResponse.error || 'No success confirmation');
          errors++;
          // DON'T mark as processed - will retry tomorrow automatically
        } else {
          // CONFIRMED SUCCESS! Mark as processed only after Resend confirmation
          const { error: markError } = await supabase
            .from('goals')
            .update({ last_motivation_date: todayDate })
            .eq('id', goal.id);

          if (markError) {
            console.error(`[EMAIL-DELIVERY] Error marking processed:`, markError);
            errors++; // Count as error since goal wasn't marked
          } else {
            console.log(`[EMAIL-DELIVERY] ✅ Email sent and confirmed, marked processed: ${goal.title}`);
            emailsSent++;
          }
        }

      } catch (error) {
        console.error(`[EMAIL-DELIVERY] Error processing goal:`, error);
        errors++;
      }
    }

    console.log(`[EMAIL-DELIVERY] ✅ Email delivery complete. Sent: ${emailsSent}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors,
        message: `Email delivery completed. Sent ${emailsSent} emails with ${errors} errors.`,
        note: 'Using pre-generated content only - no AI generation during email delivery'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[EMAIL-DELIVERY] Fatal error:', error);
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