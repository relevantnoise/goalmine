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

    console.log('🔍 DEBUG: Checking goals for user_id:', user_id);

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Query 1: Get ALL goals (no filters) to see what exists
    console.log('🔍 DEBUG: Getting ALL goals in database...');
    const { data: allGoals, error: allError } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (allError) {
      console.error('❌ Error getting all goals:', allError);
    } else {
      console.log(`📊 Found ${allGoals.length} total goals in database:`);
      allGoals.forEach((goal, i) => {
        console.log(`  ${i+1}. ID: ${goal.id}, user_id: "${goal.user_id}", title: "${goal.title}"`);
      });
    }

    // Query 2: Search for goals with exact user_id match
    console.log(`🔍 DEBUG: Searching for goals with user_id = "${user_id}"`);
    const { data: userGoals, error: userError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (userError) {
      console.error('❌ Error getting user goals:', userError);
    } else {
      console.log(`📊 Found ${userGoals.length} goals for user "${user_id}":`);
      userGoals.forEach((goal, i) => {
        console.log(`  ${i+1}. ID: ${goal.id}, title: "${goal.title}", active: ${goal.is_active}`);
      });
    }

    // Query 3: Search for goals with LIKE pattern (in case of whitespace issues)
    console.log(`🔍 DEBUG: Searching for goals with user_id LIKE "%${user_id}%"`);
    const { data: likeGoals, error: likeError } = await supabase
      .from('goals')
      .select('*')
      .ilike('user_id', `%${user_id}%`)
      .order('created_at', { ascending: false });

    if (likeError) {
      console.error('❌ Error with LIKE search:', likeError);
    } else {
      console.log(`📊 Found ${likeGoals.length} goals with LIKE pattern:`);
      likeGoals.forEach((goal, i) => {
        console.log(`  ${i+1}. ID: ${goal.id}, user_id: "${goal.user_id}", title: "${goal.title}"`);
      });
    }

    // Query 4: Check if there are goals with similar user_id patterns
    const potentialUserIds = [
      user_id,
      user_id.toLowerCase(),
      user_id.toUpperCase(),
      user_id.trim(),
    ];

    console.log('🔍 DEBUG: Checking variations of user_id...');
    for (const testId of potentialUserIds) {
      if (testId === user_id) continue; // Skip the original, we already tested it
      
      const { data: varGoals, error: varError } = await supabase
        .from('goals')
        .select('id, user_id, title')
        .eq('user_id', testId);

      if (!varError && varGoals.length > 0) {
        console.log(`📊 Found ${varGoals.length} goals for variation "${testId}"`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      debug: {
        searched_for: user_id,
        total_goals_in_db: allGoals?.length || 0,
        user_specific_goals: userGoals?.length || 0,
        like_pattern_goals: likeGoals?.length || 0,
        all_goals_sample: allGoals?.slice(0, 5).map(g => ({
          id: g.id,
          user_id: g.user_id,
          title: g.title,
          is_active: g.is_active,
          created_at: g.created_at
        })) || [],
        user_goals: userGoals || [],
        like_goals: likeGoals || []
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Debug function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Unknown error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});