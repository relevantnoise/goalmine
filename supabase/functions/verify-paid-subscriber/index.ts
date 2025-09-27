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
    console.log('[VERIFY-PAID-SUBSCRIBER] Starting verification');
    
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('userId is required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`[VERIFY-PAID-SUBSCRIBER] Checking status for ${userId}`);

    // Check subscriber status
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subError) {
      console.error('[VERIFY-PAID-SUBSCRIBER] Subscriber error:', subError);
    }

    // Check profile status  
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, goal_limit, trial_expires_at')
      .eq('email', userId)
      .single();

    if (profileError) {
      console.error('[VERIFY-PAID-SUBSCRIBER] Profile error:', profileError);
    }

    // Check goals count
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, is_active')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (goalsError) {
      console.error('[VERIFY-PAID-SUBSCRIBER] Goals error:', goalsError);
    }

    // Determine subscription status
    const isSubscribed = subscriber?.subscribed === true;
    const planName = subscriber?.plan_name || subscriber?.subscription_tier || 'Unknown';
    const goalLimit = isSubscribed ? 3 : 1;
    const currentGoalCount = goals?.length || 0;

    console.log('[VERIFY-PAID-SUBSCRIBER] Verification completed');

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: userId,
        subscriber: {
          found: !!subscriber,
          subscribed: subscriber?.subscribed || false,
          plan: planName,
          status: subscriber?.status || 'unknown',
          expiresAt: subscriber?.current_period_end || subscriber?.subscription_end
        },
        profile: {
          found: !!profile,
          email: profile?.email,
          goalLimit: profile?.goal_limit || goalLimit,
          trialExpiresAt: profile?.trial_expires_at
        },
        goals: {
          count: currentGoalCount,
          canCreateMore: currentGoalCount < goalLimit,
          list: goals?.map(g => ({ id: g.id, title: g.title })) || []
        },
        summary: {
          isPaidSubscriber: isSubscribed,
          goalQuota: `${currentGoalCount}/${goalLimit}`,
          status: isSubscribed ? 'PAID SUBSCRIBER' : 'FREE USER'
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[VERIFY-PAID-SUBSCRIBER] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);