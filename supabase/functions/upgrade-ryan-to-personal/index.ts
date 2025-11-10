import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const targetEmail = 'ryanlynn@umich.edu';
    
    console.log(`[UPGRADE-RYAN] Checking current subscription status for ${targetEmail}`);
    
    // Check current subscriber status
    const { data: currentSubscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', targetEmail)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[UPGRADE-RYAN] Error fetching subscriber:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriber' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log('[UPGRADE-RYAN] Current subscriber data:', currentSubscriber);

    // Update or insert subscriber record for Personal Plan
    const subscriberData = {
      user_id: targetEmail,
      subscribed: true,
      subscription_tier: 'Personal Plan',
      stripe_customer_id: 'test_customer_ryan',
      updated_at: new Date().toISOString()
    };

    let result;
    if (currentSubscriber) {
      // Update existing subscriber
      const { data, error } = await supabase
        .from('subscribers')
        .update(subscriberData)
        .eq('user_id', targetEmail)
        .select();
      result = { data, error };
      console.log('[UPGRADE-RYAN] Updated existing subscriber');
    } else {
      // Insert new subscriber
      const { data, error } = await supabase
        .from('subscribers')
        .insert(subscriberData)
        .select();
      result = { data, error };
      console.log('[UPGRADE-RYAN] Created new subscriber');
    }

    if (result.error) {
      console.error('[UPGRADE-RYAN] Error updating subscriber:', result.error);
      return new Response(JSON.stringify({ error: 'Failed to update subscriber' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Verify the update
    const { data: verifyData } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', targetEmail)
      .single();

    const response = {
      success: true,
      message: `Successfully upgraded ${targetEmail} to Personal Plan`,
      before: currentSubscriber,
      after: verifyData,
      action: currentSubscriber ? 'updated' : 'created'
    };

    console.log('[UPGRADE-RYAN] Success:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[UPGRADE-RYAN] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);