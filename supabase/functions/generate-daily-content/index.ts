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

function shouldSkipContentGeneration(goal: any, profile: any, isSubscribed: boolean): { skip: boolean; reason: string } {
  // Check if trial expired and not subscribed
  if (isTrialExpired(profile) && !isSubscribed) {
    return { skip: true, reason: 'Trial expired and user not subscribed' };
  }
  
  // Check if goal is expired
  if (isGoalExpired(goal)) {
    return { skip: true, reason: 'Goal has reached its target date' };
  }
  
  return { skip: false, reason: 'Goal is active and eligible for content generation' };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [CONTENT-PRE-GENERATION] BULLETPROOF AI Content Generation Starting');
    console.log('🚀 [CONTENT-PRE-GENERATION] Stage 1: Generate AI content for all active goals');
    
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
    
    console.log(`[CONTENT-PRE-GENERATION] UTC date: ${todayDate}`);
    console.log(`[CONTENT-PRE-GENERATION] Eastern time: ${easternTime}`);

    // Get all active goals
    console.log(`[CONTENT-PRE-GENERATION] Fetching all active goals...`);
    
    const { data: allGoals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true);

    if (goalsError) {
      console.error('[CONTENT-PRE-GENERATION] Error fetching goals:', goalsError);
      throw goalsError;
    }

    console.log(`[CONTENT-PRE-GENERATION] Found ${allGoals?.length || 0} active goals`);
    
    if (!allGoals || allGoals.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `No active goals found for content generation`,
          contentGenerated: 0,
          errors: 0,
          skipped: 0
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let contentGenerated = 0;
    let errors = 0;
    let skipped = 0;
    const results = [];

    // Check what content already exists for today
    const todayStart = new Date(todayDate + 'T00:00:00.000Z').toISOString();
    const todayEnd = new Date(todayDate + 'T23:59:59.999Z').toISOString();
    
    const { data: existingContent } = await supabase
      .from('motivation_history')
      .select('goal_id')
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);

    const goalsWithContent = new Set(existingContent?.map(c => c.goal_id) || []);
    console.log(`[CONTENT-PRE-GENERATION] ${goalsWithContent.size} goals already have content for today`);

    // Process each goal
    for (const goal of allGoals) {
      try {
        // Skip if we already have content for today
        if (goalsWithContent.has(goal.id)) {
          console.log(`[CONTENT-PRE-GENERATION] ⏭️ Skipping ${goal.title} - content already exists for today`);
          skipped++;
          results.push({
            goal_id: goal.id,
            title: goal.title,
            status: 'skipped',
            reason: 'Content already exists for today'
          });
          continue;
        }

        console.log(`[CONTENT-PRE-GENERATION] 🎯 Processing: "${goal.title}"`);
        
        // Get profile info for skip logic
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
          console.error(`[CONTENT-PRE-GENERATION] No profile for goal: ${goal.title}`);
          errors++;
          results.push({
            goal_id: goal.id,
            title: goal.title,
            status: 'error',
            reason: 'No profile found'
          });
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
        const skipCheck = shouldSkipContentGeneration(goal, profile, isSubscribed);
        if (skipCheck.skip) {
          console.log(`[CONTENT-PRE-GENERATION] ⏭️ Skipping: ${skipCheck.reason}`);
          skipped++;
          results.push({
            goal_id: goal.id,
            title: goal.title,
            status: 'skipped',
            reason: skipCheck.reason
          });
          continue;
        }

        // Generate AI content using existing sophisticated function
        console.log(`[CONTENT-PRE-GENERATION] 🤖 Generating AI content for: ${goal.title}`);
        
        const aiResponse = await supabase.functions.invoke('generate-daily-motivation', {
          body: {
            goalId: goal.id,
            goalTitle: goal.title,
            goalDescription: goal.description,
            tone: goal.tone || 'kind_encouraging',
            streakCount: goal.streak_count || 0,
            userId: goal.user_id,
            isNudge: false,
            targetDate: goal.target_date
          }
        });

        if (aiResponse.error || !aiResponse.data) {
          console.error(`[CONTENT-PRE-GENERATION] ❌ AI generation failed for ${goal.title}:`, aiResponse.error);
          errors++;
          results.push({
            goal_id: goal.id,
            title: goal.title,
            status: 'error',
            reason: `AI generation failed: ${aiResponse.error?.message || 'Unknown error'}`
          });
          continue;
        }

        console.log(`[CONTENT-PRE-GENERATION] ✅ AI content generated for: ${goal.title}`);
        contentGenerated++;
        results.push({
          goal_id: goal.id,
          title: goal.title,
          status: 'success',
          reason: 'AI content generated and stored'
        });

      } catch (error) {
        console.error(`[CONTENT-PRE-GENERATION] Error processing ${goal.title}:`, error);
        errors++;
        results.push({
          goal_id: goal.id,
          title: goal.title,
          status: 'error',
          reason: error.message
        });
      }
    }

    console.log(`[CONTENT-PRE-GENERATION] ✅ Content generation complete!`);
    console.log(`[CONTENT-PRE-GENERATION] Generated: ${contentGenerated}, Errors: ${errors}, Skipped: ${skipped}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Content pre-generation completed. Generated ${contentGenerated} pieces of AI content.`,
        contentGenerated,
        errors,
        skipped,
        totalGoals: allGoals.length,
        details: results,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CONTENT-PRE-GENERATION] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Content pre-generation failed'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);