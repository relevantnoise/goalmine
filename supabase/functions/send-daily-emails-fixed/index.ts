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
    console.log('[DAILY-EMAILS-FIXED] Starting daily email send process');
    
    // Check for force delivery parameter
    const { forceDelivery } = req.method === 'POST' ? await req.json() : {};

    // Initialize Supabase client early for duplicate check
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time in Eastern timezone
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
    
    // Simple delivery time: 7:00 AM Eastern
    const DELIVERY_HOUR = 7;
    const DELIVERY_MINUTE = 0;
    
    console.log(`[DAILY-EMAILS-FIXED] Current Eastern time: ${easternTime} (${currentHour}:${currentMinute})`);
    console.log(`[DAILY-EMAILS-FIXED] Delivery time: ${DELIVERY_HOUR}:${String(DELIVERY_MINUTE).padStart(2, '0')} Eastern`);

    // Get goals that need motivation today (removed the date filter for now to test)
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true);

    if (goalsError) {
      console.error('[DAILY-EMAILS-FIXED] Error fetching goals:', goalsError);
      throw goalsError;
    }

    console.log(`[DAILY-EMAILS-FIXED] Found ${goals?.length || 0} total active goals`);

    // Filter goals that need emails today (haven't been sent today)
    const goalsNeedingEmails = goals?.filter(goal => 
      !goal.last_motivation_date || goal.last_motivation_date !== todayDate
    ) || [];

    console.log(`[DAILY-EMAILS-FIXED] Found ${goalsNeedingEmails.length} goals needing emails today`);

    let emailsSent = 0;
    let errors = 0;

    for (const goal of goalsNeedingEmails) {
      try {
        // Get the user's profile for email address and trial status
        // FIXED: Use email directly since user_id IS the email
        const userEmail = goal.user_id;
        
        console.log(`[DAILY-EMAILS-FIXED] Processing goal "${goal.title}" for user: ${userEmail}`);
        
        if (!userEmail || !userEmail.includes('@')) {
          console.error(`[DAILY-EMAILS-FIXED] Invalid email for goal ${goal.title}: ${goal.user_id}`);
          errors++;
          continue;
        }

        // Get user profile - FIXED: Find by email field, not ID
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('email, trial_expires_at, created_at')
          .eq('email', userEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Use the first profile or create minimal profile
        const profile = userProfile || { 
          email: userEmail, 
          trial_expires_at: null,
          created_at: new Date().toISOString()
        };
        
        if (profileError) {
          console.log(`[DAILY-EMAILS-FIXED] Profile lookup warning for ${userEmail}:`, profileError);
        }

        // FIXED: Check subscription status using correct field names
        const { data: subscriptionData, error: subError } = await supabase
          .from('subscribers')
          .select('subscribed, subscription_tier, email')
          .eq('user_id', userEmail)  // Look by user_id which should be email
          .eq('subscribed', true)    // FIXED: Use 'subscribed' field, not 'status'
          .maybeSingle();
        
        if (subError) {
          console.log(`[DAILY-EMAILS-FIXED] Subscription lookup warning for ${userEmail}:`, subError);
        }
        
        // FIXED: Check subscription using correct field
        const isSubscribed = subscriptionData && subscriptionData.subscribed === true;
        
        console.log(`[DAILY-EMAILS-FIXED] User ${userEmail} subscription status: ${isSubscribed ? 'SUBSCRIBED' : 'NOT_SUBSCRIBED'}`);

        // Phase 2: Check if we should skip this email
        const skipCheck = shouldSkipEmailForGoal(goal, profile, isSubscribed);
        if (skipCheck.skip) {
          console.log(`[DAILY-EMAILS-FIXED] Skipping email for goal "${goal.title}": ${skipCheck.reason}`);
          continue; // Skip this goal
        }

        console.log(`[DAILY-EMAILS-FIXED] Processing email for goal "${goal.title}": ${skipCheck.reason}`);
        
        // Step 1: Ensure motivation content exists (generate if needed)
        const { data: existingMotivation, error: motivationCheckError } = await supabase
          .from('motivation_history')
          .select('*')
          .eq('goal_id', goal.id)
          .eq('user_id', goal.user_id)
          .gte('created_at', `${todayDate}T00:00:00`)
          .lt('created_at', `${todayDate}T23:59:59`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let motivationContent;
        
        // Check if we need fresh content due to streak change
        const needsFreshContent = !existingMotivation || 
          (existingMotivation.streak_count !== goal.streak_count);
        
        if (needsFreshContent) {
          if (existingMotivation) {
            console.log(`[DAILY-EMAILS-FIXED] Streak changed from ${existingMotivation.streak_count} to ${goal.streak_count} for ${goal.title} - regenerating content`);
          } else {
            console.log(`[DAILY-EMAILS-FIXED] No existing motivation for ${goal.title} - generating fresh content`);
          }
          
          // Generate AI motivation content since it doesn't exist for today
          try {
            console.log(`[DAILY-EMAILS-FIXED] Pre-generating AI motivation for goal: ${goal.title}`);
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
            
            if (aiResponse.error) {
              console.error(`[DAILY-EMAILS-FIXED] AI generation error for ${goal.title}:`, aiResponse.error);
              throw new Error('AI generation failed');
            }
            
            motivationContent = aiResponse.data;
            console.log(`[DAILY-EMAILS-FIXED] Successfully pre-generated AI content for ${goal.title}`);
            
          } catch (error) {
            console.error(`[DAILY-EMAILS-FIXED] Failed to generate AI content, using fallback:`, error);
            // Fallback content if AI generation fails
            motivationContent = {
              message: `Today is another opportunity to make progress on your goal: ${goal.title}. Keep building momentum!`,
              microPlan: ['Take one small action toward your goal today', 'Document your progress, however small', 'Reflect on how far you have already come'],
              challenge: 'Right now, take 30 seconds to visualize yourself achieving this goal.'
            };
          }
        } else {
          // Use existing motivation content (streak unchanged)
          motivationContent = {
            message: existingMotivation.message,
            microPlan: Array.isArray(existingMotivation.micro_plan) ? existingMotivation.micro_plan : [existingMotivation.micro_plan],
            challenge: existingMotivation.challenge || ''
          };
          console.log(`[DAILY-EMAILS-FIXED] Using existing motivation content for ${goal.title} (streak unchanged at ${goal.streak_count})`);
        }
        
        // Step 2: Only send email if it's within the 7 AM hour Eastern (7:00-7:59) or force delivery
        const shouldSendEmail = forceDelivery || (currentHour === DELIVERY_HOUR);
        
        if (shouldSendEmail) {
          console.log(`[DAILY-EMAILS-FIXED] Sending email for goal: ${goal.title} to ${userEmail}`);
          
          // DUPLICATE PREVENTION: Check if this specific goal already got email today - REMOVED for testing
          // if (goal.last_motivation_date === todayDate) {
          //   console.log(`[DAILY-EMAILS-FIXED] Goal "${goal.title}" already received email today - skipping`);
          //   continue;
          // }
          
          // Update the goal's last motivation date BEFORE sending email
          const { error: updateError } = await supabase
            .from('goals')
            .update({ last_motivation_date: todayDate })
            .eq('id', goal.id);
          
          if (updateError) {
            console.error(`[DAILY-EMAILS-FIXED] Failed to update last_motivation_date for ${goal.title}:`, updateError);
            errors++;
            continue; // Skip this goal to prevent duplicate
          }
          
          // Call the send-motivation-email function with pre-generated content
          const emailResponse = await supabase.functions.invoke('send-motivation-email', {
            body: {
              email: userEmail,
              name: userEmail.split('@')[0],
              goal: goal.title,
              message: motivationContent.message,
              microPlan: Array.isArray(motivationContent.microPlan) ? 
                motivationContent.microPlan.join('\n• ') : 
                motivationContent.microPlan,
              challenge: motivationContent.challenge,
              streak: goal.streak_count,
              redirectUrl: 'https://goalmine.ai',
              isNudge: false,
              userId: goal.user_id,
              goalId: goal.id
            }
          });

          if (emailResponse.error) {
            console.error(`[DAILY-EMAILS-FIXED] Error sending email for goal ${goal.title}:`, emailResponse.error);
            errors++;
          } else {
            console.log(`[DAILY-EMAILS-FIXED] Successfully sent email for goal: ${goal.title}`);
            emailsSent++;
          }
        } else {
          console.log(`[DAILY-EMAILS-FIXED] Content ready for ${goal.title} but not sending - only sends during the 7 AM Eastern hour. Current time: ${currentHour}:${String(currentMinute).padStart(2, '0')} Eastern`);
        }
      } catch (error) {
        console.error(`[DAILY-EMAILS-FIXED] Error processing goal ${goal.title}:`, error);
        errors++;
      }
    }

    console.log(`[DAILY-EMAILS-FIXED] Process complete. Sent: ${emailsSent}, Errors: ${errors}`);

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