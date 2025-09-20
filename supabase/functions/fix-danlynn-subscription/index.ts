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

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create/update danlynn@gmail.com as a paid subscriber
    const { data, error } = await supabase
      .from('subscribers')
      .upsert({
        user_id: 'danlynn@gmail.com',
        email: 'danlynn@gmail.com',
        subscribed: true,  // This is what the backend checks!
        subscription_tier: 'Personal Plan',
        plan_name: 'Personal Plan',
        status: 'active',
        stripe_customer_id: 'cus_test_danlynn',
        stripe_subscription_id: 'sub_test_danlynn',
        current_period_end: '2025-12-31T23:59:59Z',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error:', error);
      throw error;
    }

    console.log('Fixed subscription:', data);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'danlynn@gmail.com is now a paid subscriber',
      data
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});