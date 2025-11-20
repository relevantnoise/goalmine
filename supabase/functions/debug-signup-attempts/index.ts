import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔍 Debugging signup attempts...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check recent profiles created
    const { data: recentProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .gte('created_at', '2025-11-19T00:00:00Z')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Check if there are any orphaned/incomplete profiles
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, email, created_at, trial_expires_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allProfilesError) {
      console.error("Error fetching all profiles:", allProfilesError);
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      recentProfiles: recentProfiles || [],
      recentProfilesCount: recentProfiles?.length || 0,
      allRecentProfiles: allProfiles || [],
      message: recentProfiles?.length === 0 
        ? "No profiles created since Nov 19, 2025 - signup likely failed at Firebase OAuth level"
        : `${recentProfiles.length} profiles created since Nov 19, 2025`
    };

    console.log("Debug results:", debugInfo);

    return new Response(JSON.stringify(debugInfo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Debug error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});