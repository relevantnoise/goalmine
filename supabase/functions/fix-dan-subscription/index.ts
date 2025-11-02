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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables');
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    // Update Dan's subscription record to fix the issues
    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .update({
        user_id: 'danlynn@gmail.com', // Change to email for consistency with create-goal function
        subscription_tier: 'Professional Plan', // Set the proper tier
        updated_at: new Date().toISOString()
      })
      .eq('email', 'danlynn@gmail.com')
      .select();

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    console.log('Updated subscription record:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Subscription record updated successfully',
      subscription: data[0]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});