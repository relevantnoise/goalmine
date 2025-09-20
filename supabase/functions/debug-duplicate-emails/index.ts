import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId = 'danlynn@gmail.com' } = req.method === 'POST' ? await req.json() : {};
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`[DEBUG] Analyzing duplicate emails for: ${userId}`);

    // Get current time in Eastern timezone
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    
    // 1. Check user's goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, user_id, last_motivation_date, is_active, created_at')
      .or(`user_id.eq.${userId},user_id.ilike.%${userId.split('@')[0]}%`)
      .order('created_at');

    console.log(`[DEBUG] Found ${goals?.length || 0} goals for user`);

    // 2. Check which goals would be selected by daily email query
    const { data: eligibleGoals, error: eligibleError } = await supabase
      .from('goals')
      .select('id, title, user_id, last_motivation_date, is_active')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${todayDate}`)
      .or(`user_id.eq.${userId},user_id.ilike.%${userId.split('@')[0]}%`);

    console.log(`[DEBUG] Found ${eligibleGoals?.length || 0} eligible goals for today (${todayDate})`);

    // 3. Check email delivery logs for today
    const { data: emailLogs, error: emailError } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('recipient_email', userId)
      .gte('created_at', `${todayDate}T00:00:00`)
      .lt('created_at', `${todayDate}T23:59:59`)
      .order('created_at');

    // 4. Check profile information
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userId)
      .single();

    const { data: profileById } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // 5. Check subscription status
    const { data: subscription } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .single();

    const analysis = {
      userId,
      todayDate,
      analysis: {
        allGoals: goals || [],
        eligibleGoalsToday: eligibleGoals || [],
        emailDeliveriesToday: emailLogs || [],
        profileLookupByEmail: profileByEmail,
        profileLookupById: profileById,
        subscriptionData: subscription,
      },
      issues: [],
      recommendations: []
    };

    // Analyze potential issues
    if ((eligibleGoals?.length || 0) > 1) {
      analysis.issues.push(`Multiple eligible goals found: ${eligibleGoals?.length}. Each goal triggers a separate email.`);
    }

    if ((emailLogs?.length || 0) > (eligibleGoals?.length || 0)) {
      analysis.issues.push(`More email deliveries (${emailLogs?.length}) than eligible goals (${eligibleGoals?.length}). This indicates duplicate processing.`);
    }

    const duplicateGoals = goals?.filter((g, i, arr) => 
      arr.findIndex(other => other.title === g.title && other.user_id === g.user_id) !== i
    );

    if (duplicateGoals && duplicateGoals.length > 0) {
      analysis.issues.push(`Duplicate goals found: ${duplicateGoals.length} goals with same title/user_id`);
      analysis.recommendations.push("Clean up duplicate goals in database");
    }

    // Check for race conditions
    const sameMinuteEmails = emailLogs?.filter(email => {
      const others = emailLogs.filter(other => 
        other.id !== email.id && 
        Math.abs(new Date(other.created_at).getTime() - new Date(email.created_at).getTime()) < 60000
      );
      return others.length > 0;
    });

    if (sameMinuteEmails && sameMinuteEmails.length > 0) {
      analysis.issues.push(`${sameMinuteEmails.length} emails sent within same minute - possible race condition`);
      analysis.recommendations.push("Investigate concurrent executions of daily-cron");
    }

    // Check if goals have been processed today but still showing as eligible
    const processedButEligible = eligibleGoals?.filter(goal => 
      goal.last_motivation_date === todayDate
    );

    if (processedButEligible && processedButEligible.length > 0) {
      analysis.issues.push(`${processedButEligible.length} goals marked as processed today but still appearing in eligible query`);
      analysis.recommendations.push("Check atomic update timing in send-daily-emails function");
    }

    console.log('[DEBUG] Analysis complete:', analysis);

    return new Response(
      JSON.stringify(analysis, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG] Error in analysis:', error);
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