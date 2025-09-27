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
    console.log('[REMOVE-TRIAL] Removing trial_expires_at for danlynn@gmail.com (permanent test subscriber)');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check current state
    const { data: beforeProfile } = await supabase
      .from('profiles')
      .select('email, trial_expires_at, created_at')
      .eq('email', 'danlynn@gmail.com')
      .single();

    console.log('[BEFORE]', beforeProfile);

    if (!beforeProfile) {
      throw new Error('Profile not found for danlynn@gmail.com');
    }

    // Remove trial expiration date for permanent subscriber
    const { data: afterProfile, error } = await supabase
      .from('profiles')
      .update({ trial_expires_at: null })
      .eq('email', 'danlynn@gmail.com')
      .select('email, trial_expires_at, created_at')
      .single();

    if (error) throw error;

    console.log('[AFTER]', afterProfile);

    // Verify subscriber status
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('user_id, subscribed, plan_name, status')
      .eq('user_id', 'danlynn@gmail.com')
      .single();

    console.log('[SUBSCRIBER]', subscriber);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully removed trial expiration for danlynn@gmail.com',
        changes: {
          before_trial: beforeProfile.trial_expires_at,
          after_trial: afterProfile.trial_expires_at,
          is_permanent_subscriber: !!subscriber?.subscribed
        },
        explanation: 'danlynn@gmail.com is now properly configured as a permanent test subscriber without trial warnings',
        expected_result: 'Will no longer receive trial expiration warning emails'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('[REMOVE-TRIAL] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);