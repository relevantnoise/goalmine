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
    // Create Supabase client with service role (can modify RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log('🔧 Disabling RLS on goals table...');

    // Disable RLS on goals table
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE goals DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError) {
      console.error('❌ Error disabling RLS:', disableError);
      return new Response(JSON.stringify({
        success: false,
        error: disableError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Grant permissions to anon role
    const { error: grantError } = await supabase.rpc('exec_sql', {
      sql: 'GRANT SELECT, INSERT, UPDATE, DELETE ON goals TO anon;'
    });

    if (grantError) {
      console.error('❌ Error granting permissions:', grantError);
      // Continue anyway, this might not be critical
    }

    console.log('✅ RLS disabled on goals table');

    return new Response(JSON.stringify({
      success: true,
      message: "RLS disabled on goals table - frontend can now access goals directly"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Unknown error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});