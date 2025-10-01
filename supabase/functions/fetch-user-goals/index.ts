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
    const body = await req.json();
    const { user_id } = body;

    console.log('🔍 Fetching goals for user:', user_id);

    if (!user_id) {
      return new Response(JSON.stringify({
        success: false,
        error: "user_id is required"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // HYBRID: Fetch goals using both email AND Firebase UID to support both architectures
    console.log('🔍 HYBRID: Looking for goals using both email and Firebase UID approaches');
    
    // First, try to get profile to find Firebase UID
    const { data: userProfileResults } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', user_id);
    
    const userProfile = userProfileResults && userProfileResults.length > 0 ? userProfileResults[0] : null;

    let goalQueries = [];
    
    // Query 1: Look for goals with email as user_id (OLD architecture)
    goalQueries.push(
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_active', true)
    );
    
    // Query 2: If profile exists, also look for goals with Firebase UID as user_id (NEW architecture)
    if (userProfile?.id) {
      console.log('🔍 Also searching for goals with Firebase UID:', userProfile.id);
      goalQueries.push(
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', userProfile.id)
          .eq('is_active', true)
      );
    }
    
    // Execute all queries in parallel
    const results = await Promise.all(goalQueries);
    
    // Combine all goals from both queries, removing duplicates by ID
    let allGoals = [];
    const seenIds = new Set();
    
    for (const result of results) {
      if (result.data) {
        for (const goal of result.data) {
          if (!seenIds.has(goal.id)) {
            seenIds.add(goal.id);
            allGoals.push(goal);
          }
        }
      }
    }
    
    // Sort by created_at descending
    allGoals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    console.log(`✅ HYBRID: Found ${allGoals.length} total goals for user ${user_id}`);
    
    const data = allGoals;
    const error = null;

    if (error) {
      console.error('❌ Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log('✅ Found', data.length, 'goals for user:', user_id);

    return new Response(JSON.stringify({
      success: true,
      goals: data
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