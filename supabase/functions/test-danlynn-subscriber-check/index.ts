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
    console.log('[TEST-DANLYNN] Testing subscriber check logic for danlynn@gmail.com');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get danlynn's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, trial_expires_at')
      .eq('email', 'danlynn@gmail.com')
      .single();

    console.log('[TEST] Profile:', profile);

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Test the same subscriber check logic used in send-trial-warning
    let isSubscriber = false;
    
    // Check by email (most common case)
    const { data: subscriberByEmail, error: emailError } = await supabase
      .from('subscribers')
      .select('subscribed, user_id, plan_name, status')
      .eq('user_id', profile.email)
      .eq('subscribed', true)
      .single();

    console.log('[TEST] Subscriber by email query result:', subscriberByEmail, emailError);

    // Also check by Firebase UID (for proper architecture)
    const { data: subscriberById, error: idError } = await supabase
      .from('subscribers')
      .select('subscribed, user_id, plan_name, status')
      .eq('user_id', profile.id)
      .eq('subscribed', true)
      .single();

    console.log('[TEST] Subscriber by ID query result:', subscriberById, idError);

    isSubscriber = !!(subscriberByEmail || subscriberById);

    console.log('[TEST] Final isSubscriber result:', isSubscriber);

    // Calculate trial info
    let trialInfo = null;
    if (profile.trial_expires_at) {
      const now = new Date();
      const trialExpires = new Date(profile.trial_expires_at);
      const daysRemaining = Math.ceil((trialExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      trialInfo = {
        expires_at: profile.trial_expires_at,
        daysRemaining,
        isExpired: daysRemaining <= 0
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: {
          id: profile.id,
          email: profile.email,
          trial_expires_at: profile.trial_expires_at
        },
        subscriberByEmail: {
          found: !!subscriberByEmail,
          data: subscriberByEmail,
          error: emailError?.message
        },
        subscriberById: {
          found: !!subscriberById, 
          data: subscriberById,
          error: idError?.message
        },
        isSubscriber,
        trialInfo,
        shouldBeExcluded: isSubscriber,
        shouldReceiveWarnings: !isSubscriber && trialInfo && trialInfo.daysRemaining > 0 && trialInfo.daysRemaining <= 7,
        logic: {
          step1: 'Query subscribers by email (user_id = profile.email)',
          step2: 'Query subscribers by Firebase UID (user_id = profile.id)',
          step3: 'isSubscriber = !!(subscriberByEmail || subscriberById)',
          step4: 'if isSubscriber => exclude from trial warnings'
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[TEST-DANLYNN] Error:', error);
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