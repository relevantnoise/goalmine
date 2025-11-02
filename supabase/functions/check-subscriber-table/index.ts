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

    // Get all subscribers to see the structure
    const { data: allSubscribers, error: allError } = await supabaseAdmin
      .from('subscribers')
      .select('*');

    console.log('All subscribers:', allSubscribers);
    console.log('Subscribers error:', allError);

    // Specifically look for Dan's record
    const { data: danRecord, error: danError } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .eq('user_id', 'danlynn@gmail.com');

    console.log('Dan record:', danRecord);
    console.log('Dan error:', danError);

    return new Response(JSON.stringify({ 
      success: true, 
      allSubscribers: allSubscribers,
      allError: allError,
      danRecord: danRecord,
      danError: danError
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