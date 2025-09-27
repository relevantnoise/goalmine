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
    console.log('[DAILY-EMAILS] Starting daily email send process');
    
    // Check for force delivery parameter
    const { forceDelivery } = req.method === 'POST' ? await req.json() : {};

    // Initialize Supabase client early for duplicate check
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time in Eastern timezone
    const now = new Date();
    
    // CRITICAL FIX: Use Pacific/Midway timezone for date calculation
    // Midnight in Pacific/Midway = 11:00 AM UTC = 7:00 AM EDT
    // This triggers emails at 7:00 AM EDT when the date rolls over in Pacific/Midway
    const midwayDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Midway'
    }).format(now);
    const todayDate = midwayDate; // YYYY-MM-DD in Pacific/Midway time
    
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
    
    // Debug timezone calculations
    const utcDate = now.toISOString().split('T')[0];
    const easternDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York'
    }).format(now);
    console.log(`[DAILY-EMAILS] UTC date (ORIGINAL): ${utcDate}`);
    console.log(`[DAILY-EMAILS] Eastern date (PREVIOUS): ${easternDate}`);
    console.log(`[DAILY-EMAILS] Pacific/Midway date (NEW TRIGGER): ${todayDate}`);
    console.log(`[DAILY-EMAILS] Current Eastern time: ${easternTime} (${currentHour}:${currentMinute})`);
    console.log(`[DAILY-EMAILS] Email trigger logic: Date rollover in Pacific/Midway = ~7:00 AM EDT`);

    // ✅ CRITICAL FIX: Enforce "emails start tomorrow" rule - prevent same-day delivery
    // Only send daily emails during proper morning delivery window (7-10 AM EDT)
    const isProperDeliveryWindow = currentHour >= 7 && currentHour <= 10;
    if (!isProperDeliveryWindow && !forceDelivery) {
      console.log(`[DAILY-EMAILS] Outside proper delivery window (${currentHour}:${String(currentMinute).padStart(2, '0')} EDT). Daily emails only send 7-10 AM EDT to enforce 'emails start tomorrow' rule.`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Outside delivery window (${currentHour}:${String(currentMinute).padStart(2, '0')} EDT). Daily emails only send 7-10 AM EDT.`,
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

    console.log(`[DAILY-EMAILS] ✅ Within proper delivery window (${currentHour}:${String(currentMinute).padStart(2, '0')} EDT), proceeding with email delivery`);

    // IMPROVED ATOMIC FIX: Use individual atomic updates to prevent race conditions
    // Each goal is processed atomically, preventing duplicates even with concurrent function calls
    console.log(`[DAILY-EMAILS] Using individual atomic updates to prevent duplicates for date: ${todayDate}`);
    
    // First, get candidate goals (but don't update them yet)
    const { data: candidateGoals, error: candidateError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${todayDate}`);

    if (candidateError) {
      console.error('[DAILY-EMAILS] Error fetching candidate goals:', candidateError);
      throw candidateError;
    }

    console.log(`[DAILY-EMAILS] Found ${candidateGoals?.length || 0} candidate goals for ${todayDate}`);

    // Now atomically claim each goal one by one
    const goals: any[] = [];
    let claimed = 0;
    let alreadyProcessed = 0;

    for (const candidate of candidateGoals || []) {
      try {
        // Atomic operation: Only update if the goal still needs processing
        // This prevents race conditions where multiple function calls try to process the same goal
        const { data: atomicUpdate, error: atomicError } = await supabase
          .from('goals')
          .update({ last_motivation_date: todayDate })
          .eq('id', candidate.id)
          .eq('is_active', true)
          .or(`last_motivation_date.is.null,last_motivation_date.lt.${todayDate}`)
          .select('*');

        if (atomicError) {
          console.error(`[DAILY-EMAILS] Atomic update error for goal ${candidate.id}:`, atomicError);
          continue;
        }

        if (atomicUpdate && atomicUpdate.length > 0) {
          // Successfully claimed this goal for processing
          goals.push(atomicUpdate[0]);
          claimed++;
          console.log(`[DAILY-EMAILS] ✅ Claimed goal: "${candidate.title}" (${candidate.id})`);
        } else {
          // Goal was already processed by another function call - skip it
          alreadyProcessed++;
          console.log(`[DAILY-EMAILS] ⏭️  Goal already processed: "${candidate.title}" (${candidate.id})`);
        }
      } catch (error) {
        console.error(`[DAILY-EMAILS] Error claiming goal ${candidate.id}:`, error);
      }
    }

    console.log(`[DAILY-EMAILS] Atomic claiming complete: ${claimed} claimed, ${alreadyProcessed} already processed, ${goals.length} total to process`);
    
    if (goals.length === 0) {
      console.log(`[DAILY-EMAILS] No goals to process for ${todayDate} - all already handled or none eligible`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `No goals need processing for ${todayDate} - all already handled`,
          emailsSent: 0,
          errors: 0,
          debug: {
            candidateGoals: candidateGoals?.length || 0,
            claimed: claimed,
            alreadyProcessed: alreadyProcessed,
            todayDate: todayDate
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // ✅ ENFORCE "EMAILS START TOMORROW" RULE: Filter out goals created today
    const eligibleGoals = (goals || []).filter(goal => {
      const goalCreatedDate = new Date(goal.created_at);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const wasCreatedToday = goalCreatedDate >= todayStart;
      
      if (wasCreatedToday) {
        console.log(`[DAILY-EMAILS] 🚫 Skipping goal "${goal.title}" - created today (${goalCreatedDate.toISOString()}). Emails start tomorrow per design.`);
        return false;
      }
      
      console.log(`[DAILY-EMAILS] ✅ Goal "${goal.title}" eligible - created ${goalCreatedDate.toISOString()}`);
      return true;
    });

    console.log(`[DAILY-EMAILS] Found ${goals?.length || 0} total goals, ${eligibleGoals.length} eligible after filtering same-day creations`);

    let emailsSent = 0;
    let errors = 0;

    for (const goal of eligibleGoals) {
      try {
        console.log(`[DAILY-EMAILS] Processing goal: "${goal.title}" (user_id: ${goal.user_id})`);
        
        // HYBRID FIX: Handle both email-based and Firebase UID-based goals
        let userProfile = null;
        let profileError = null;
        
        if (goal.user_id.includes('@')) {
          console.log(`[DAILY-EMAILS] Email-based goal - looking up profile by email: ${goal.user_id}`);
          const result = await supabase
            .from('profiles')
            .select('email, trial_expires_at, created_at')
            .eq('email', goal.user_id)
            .single();
          userProfile = result.data;
          profileError = result.error;
        } else {
          console.log(`[DAILY-EMAILS] Firebase UID-based goal - looking up profile by ID: ${goal.user_id}`);
          const result = await supabase
            .from('profiles')
            .select('email, trial_expires_at, created_at')
            .eq('id', goal.user_id)
            .single();
          userProfile = result.data;
          profileError = result.error;
        }

        console.log(`[DAILY-EMAILS] Profile lookup result:`, { userProfile, profileError });

        // Better fallback handling
        let profile;
        if (userProfile) {
          profile = userProfile;
        } else if (goal.user_id.includes('@')) {
          // Email-based goal without profile - use email directly
          profile = { email: goal.user_id, trial_expires_at: null };
        } else {
          // Firebase UID-based goal without profile - this is the error we keep seeing
          console.error(`[DAILY-EMAILS] No profile found for Firebase UID goal ${goal.title}: ${goal.user_id} (profileError: ${profileError})`);
          errors++;
          continue;
        }
        
        console.log(`[DAILY-EMAILS] Final profile:`, profile);
          
        if (!profile.email || !profile.email.includes('@')) {
          console.error(`[DAILY-EMAILS] Invalid email for goal ${goal.title}: ${goal.user_id} -> ${profile.email}`);
          errors++;
          continue;
        }

        // Check subscription status - INCLUDE FREE TRIAL USERS
        // HYBRID: Handle both email-based and Firebase UID-based goals for subscription lookup
        let subscriptionData = null;
        
        // First, check if goal.user_id looks like an email (OLD architecture)
        if (goal.user_id.includes('@')) {
          // Goal user_id is email, use directly - CHECK ALL SUBSCRIPTION RECORDS, NOT JUST ACTIVE ONES
          const { data } = await supabase
            .from('subscribers')
            .select('subscribed, subscription_tier, email')
            .eq('user_id', goal.user_id)
            .single();
          subscriptionData = data;
        } else {
          // Goal user_id is Firebase UID (NEW architecture), need to find email via profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', goal.user_id)
            .single();
          
          if (profileData?.email) {
            const { data } = await supabase
              .from('subscribers')
              .select('subscribed, subscription_tier, email')
              .eq('user_id', profileData.email)
              .single();
            subscriptionData = data;
          }
        }
        
        // User is "subscribed" if they have an active paid subscription
        // Free trial users (no subscription record) are handled by trial expiration logic below
        const isSubscribed = subscriptionData && subscriptionData.subscribed === true;

        // Phase 2: Check if we should skip this email
        const skipCheck = shouldSkipEmailForGoal(goal, profile, isSubscribed);
        if (skipCheck.skip) {
          console.log(`[DAILY-EMAILS] Skipping email for goal "${goal.title}": ${skipCheck.reason}`);
          continue; // Skip this goal
        }

        console.log(`[DAILY-EMAILS] Processing email for goal "${goal.title}": ${skipCheck.reason}`);
        
        // Step 1: Ensure motivation content exists (generate if needed)
        const today = new Date().toISOString().split('T')[0];
        const { data: existingMotivation, error: motivationCheckError } = await supabase
          .from('motivation_history')
          .select('*')
          .eq('goal_id', goal.id)
          .eq('user_id', goal.user_id)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let motivationContent;
        
        // Check if we need fresh content due to streak change
        const needsFreshContent = !existingMotivation || 
          (existingMotivation.streak_count !== goal.streak_count);
        
        if (needsFreshContent) {
          if (existingMotivation) {
            console.log(`[DAILY-EMAILS] Streak changed from ${existingMotivation.streak_count} to ${goal.streak_count} for ${goal.title} - regenerating content`);
          } else {
            console.log(`[DAILY-EMAILS] No existing motivation for ${goal.title} - generating fresh content`);
          }
          // Generate AI motivation content since it doesn't exist for today
          try {
            console.log(`[DAILY-EMAILS] Pre-generating AI motivation for goal: ${goal.title}`);
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
              console.error(`[DAILY-EMAILS] AI generation error for ${goal.title}:`, aiResponse.error);
              throw new Error('AI generation failed');
            }
            
            motivationContent = aiResponse.data;
            console.log(`[DAILY-EMAILS] Successfully pre-generated AI content for ${goal.title}`);
            
          } catch (error) {
            console.error(`[DAILY-EMAILS] Failed to generate AI content, using fallback:`, error);
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
          console.log(`[DAILY-EMAILS] Using existing motivation content for ${goal.title} (streak unchanged at ${goal.streak_count})`);
        }
        
        // Step 2: Send emails when cron runs (cron job controls timing at 7 AM Eastern)
        // Remove hourly restriction since cron job already schedules at correct time
        const shouldSendEmail = true; // Always send when function is called by cron
        
        if (shouldSendEmail) {
          console.log(`[DAILY-EMAILS] Sending email for goal: ${goal.title} to ${profile.email}`);
          
          // Call the send-motivation-email function with pre-generated content
          const emailResponse = await supabase.functions.invoke('send-motivation-email', {
            body: {
              email: profile.email,
              name: profile.email.split('@')[0],
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
            console.error(`[DAILY-EMAILS] Error sending email for goal ${goal.title}:`, emailResponse.error);
            errors++;
          } else {
            console.log(`[DAILY-EMAILS] Successfully sent email for goal: ${goal.title}`);
            emailsSent++;
          }
        } else {
          console.log(`[DAILY-EMAILS] Content ready for ${goal.title} but not sending - only sends during the 7 AM Eastern hour. Current time: ${currentHour}:${String(currentMinute).padStart(2, '0')} Eastern`);
        }
      } catch (error) {
        console.error(`[DAILY-EMAILS] Error processing goal ${goal.title}:`, error);
        errors++;
      }
    }

    console.log(`[DAILY-EMAILS] Process complete. Sent: ${emailsSent}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors,
        message: `Daily email process completed. Sent ${emailsSent} emails with ${errors} errors.`,
        debug: {
          totalGoals: goals?.length || 0,
          eligibleGoals: eligibleGoals.length,
          skippedSameDayGoals: (goals?.length || 0) - eligibleGoals.length,
          todayDate,
          forceDelivery: !!forceDelivery
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DAILY-EMAILS] Fatal error:', error);
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