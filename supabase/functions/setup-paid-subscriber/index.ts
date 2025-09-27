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
    console.log('[SETUP-PAID-SUBSCRIBER] Starting paid subscriber setup');
    
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('userId is required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`[SETUP-PAID-SUBSCRIBER] Setting up ${userId} as paid subscriber`);

    // 1. Update/Insert subscriber record
    const { data: subscriberData, error: subscriberError } = await supabase
      .from('subscribers')
      .upsert({
        user_id: userId,
        stripe_customer_id: `cus_test_${userId.split('@')[0]}_paid`,
        stripe_subscription_id: `sub_test_${userId.split('@')[0]}_paid`,
        plan_name: 'Personal Plan',
        status: 'active',
        subscribed: true,
        current_period_end: '2025-12-31T23:59:59.000Z',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (subscriberError) {
      console.error('[SETUP-PAID-SUBSCRIBER] Error updating subscriber:', subscriberError);
      throw subscriberError;
    }

    console.log('[SETUP-PAID-SUBSCRIBER] Subscriber record updated:', subscriberData);

    // 2. Remove trial expiration from profile (if exists)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        trial_expires_at: null,
        goal_limit: 3, // Premium goal limit
        updated_at: new Date().toISOString()
      })
      .eq('email', userId)
      .select();

    if (profileError) {
      console.warn('[SETUP-PAID-SUBSCRIBER] Profile update warning (may not exist):', profileError);
    } else {
      console.log('[SETUP-PAID-SUBSCRIBER] Profile updated:', profileData);
    }

    // 3. Get current status to verify
    const { data: currentSubscriber } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('email, goal_limit, trial_expires_at')
      .eq('email', userId)
      .single();

    console.log('[SETUP-PAID-SUBSCRIBER] Setup completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully set up ${userId} as paid subscriber`,
        subscriber: currentSubscriber,
        profile: currentProfile
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[SETUP-PAID-SUBSCRIBER] Error:', error);
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