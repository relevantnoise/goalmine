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

    const userEmail = "danlynn@gmail.com";

    // Check if subscription record already exists
    const { data: existingSubscriber } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .eq('user_id', userEmail)
      .single();

    if (existingSubscriber) {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from('subscribers')
        .update({
          subscribed: true,
          subscription_tier: 'Professional Plan',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userEmail)
        .select();

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'updated',
        subscription: data[0]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Create new subscription record
      const { data, error } = await supabaseAdmin
        .from('subscribers')
        .insert([{
          user_id: userEmail,
          subscribed: true,
          subscription_tier: 'Professional Plan',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        throw new Error(`Failed to create subscription: ${error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'created',
        subscription: data[0]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

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