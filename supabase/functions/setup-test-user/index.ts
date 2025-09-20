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
    const { email } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`[SETUP-TEST] Setting up test user: ${email}`);

    // Clean up existing data
    await supabase.from('motivation_history').delete().eq('user_id', email);
    await supabase.from('goals').delete().eq('user_id', email);
    await supabase.from('subscribers').delete().eq('user_id', email);
    await supabase.from('profiles').delete().eq('email', email);

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: email,
        email: email,
        display_name: email.split('@')[0],
        goal_limit: 3,
        trial_expires_at: '2025-12-31T23:59:59Z',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('[SETUP-TEST] Profile error:', profileError);
      throw profileError;
    }

    // Create subscriber
    const { error: subscriberError } = await supabase
      .from('subscribers')
      .insert({
        user_id: email,
        stripe_customer_id: `cus_test_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        stripe_subscription_id: `sub_test_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        plan_name: 'Personal Plan',
        status: 'active',
        current_period_end: '2025-12-31T23:59:59Z',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (subscriberError) {
      console.error('[SETUP-TEST] Subscriber error:', subscriberError);
      throw subscriberError;
    }

    // Create test goal
    const { error: goalError } = await supabase
      .from('goals')
      .insert({
        user_id: email,
        title: 'Daily Exercise',
        description: 'Exercise for 30 minutes every day',
        target_date: '2025-12-31',
        tone: 'kind_encouraging',
        streak_count: 5,
        is_active: true,
        last_check_in: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (goalError) {
      console.error('[SETUP-TEST] Goal error:', goalError);
      throw goalError;
    }

    console.log(`[SETUP-TEST] Successfully set up test user: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Test user ${email} created successfully with profile, subscription, and goal`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[SETUP-TEST] Error:', error);
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