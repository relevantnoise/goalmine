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
    console.log('[FIX-DANLYNN] Removing trial_expires_at for permanent test subscriber danlynn@gmail.com');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check current state
    const { data: beforeProfile } = await supabase
      .from('profiles')
      .select('id, email, trial_expires_at, created_at')
      .eq('email', 'danlynn@gmail.com')
      .single();

    console.log('[FIX] Before update:', beforeProfile);

    if (!beforeProfile) {
      return new Response(JSON.stringify({ error: 'Profile not found for danlynn@gmail.com' }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Update profile to remove trial expiration (permanent subscriber)
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        trial_expires_at: null  // Remove trial expiration for permanent test subscriber
      })
      .eq('email', 'danlynn@gmail.com')
      .select()
      .single();

    if (updateError) {
      console.error('[FIX] Update error:', updateError);
      throw updateError;
    }

    console.log('[FIX] After update:', updatedProfile);

    // Verify subscriber record exists
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', 'danlynn@gmail.com')
      .single();

    console.log('[FIX] Subscriber record:', subscriber);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully removed trial_expires_at for danlynn@gmail.com - he will no longer receive trial warning emails',
        before: {
          email: beforeProfile.email,
          trial_expires_at: beforeProfile.trial_expires_at,
          had_trial: !!beforeProfile.trial_expires_at
        },
        after: {
          email: updatedProfile.email,
          trial_expires_at: updatedProfile.trial_expires_at,
          has_trial: !!updatedProfile.trial_expires_at
        },
        subscriber: {
          exists: !!subscriber,
          subscribed: subscriber?.subscribed,
          plan_name: subscriber?.plan_name
        },
        explanation: 'danlynn@gmail.com is a permanent test subscriber and should not have trial_expires_at date. This change ensures he is excluded from all trial warning emails.'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[FIX-DANLYNN] Error:', error);
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