import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { userId } = await req.json();
    console.log(`[DEBUG] Checking subscription limits for user: ${userId}`);

    // 1. Check profiles table
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, email, goal_limit')
      .or(`id.eq.${userId},email.eq.${userId}`)
      .single();

    console.log(`[DEBUG] Profile query result:`, { profile, profileError });

    // 2. Check subscribers table
    const { data: subscriber, error: subscriberError } = await supabaseClient
      .from('subscribers')
      .select('user_id, plan_name, status, current_period_end')
      .eq('user_id', userId)
      .single();

    console.log(`[DEBUG] Subscriber query result:`, { subscriber, subscriberError });

    // 3. Count active goals
    const { data: goals, error: goalsError, count } = await supabaseClient
      .from('goals')
      .select('id, title, is_active', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true);

    console.log(`[DEBUG] Goals query result:`, { goals, goalsError, count });

    // 4. Determine subscription status
    const isSubscribed = subscriber && subscriber.status === 'active';
    const goalLimit = isSubscribed ? 3 : 1;
    const currentGoalCount = count || 0;

    console.log(`[DEBUG] Subscription analysis:`, {
      isSubscribed,
      goalLimit,
      currentGoalCount,
      canCreateMore: currentGoalCount < goalLimit
    });

    return new Response(JSON.stringify({
      userId,
      profile,
      subscriber,
      goals,
      analysis: {
        isSubscribed,
        goalLimit,
        currentGoalCount,
        canCreateMore: currentGoalCount < goalLimit,
        profileError: profileError?.message,
        subscriberError: subscriberError?.message,
        goalsError: goalsError?.message
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[DEBUG] Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});