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
    // Use service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log('🔧 Starting goal limit enforcement...');

    // Get all users and their goals
    const { data: allGoals, error: goalsError } = await supabaseAdmin
      .from('goals')
      .select('id, user_id, title, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: true }); // Keep oldest goals

    if (goalsError) {
      throw new Error(`Failed to fetch goals: ${goalsError.message}`);
    }

    console.log(`📊 Found ${allGoals?.length || 0} active goals`);

    // Group goals by user
    const goalsByUser = allGoals?.reduce((acc: Record<string, any[]>, goal) => {
      if (!acc[goal.user_id]) {
        acc[goal.user_id] = [];
      }
      acc[goal.user_id].push(goal);
      return acc;
    }, {}) || {};

    console.log(`👥 Found ${Object.keys(goalsByUser).length} users with goals`);

    let totalFixed = 0;
    const results: any[] = [];

    for (const [userId, userGoals] of Object.entries(goalsByUser)) {
      // Check subscription status
      const { data: subscriber } = await supabaseAdmin
        .from('subscribers')
        .select('subscribed')
        .eq('user_id', userId)
        .single();

      const isSubscribed = subscriber?.subscribed === true;
      const maxGoals = isSubscribed ? 3 : 1;
      const currentGoalCount = userGoals.length;

      console.log(`🔍 User ${userId}: ${currentGoalCount} goals, subscription: ${isSubscribed ? 'Premium' : 'Free'}, max: ${maxGoals}`);

      if (currentGoalCount > maxGoals) {
        // Keep the oldest goals, deactivate the rest
        const goalsToKeep = userGoals.slice(0, maxGoals);
        const goalsToDeactivate = userGoals.slice(maxGoals);

        console.log(`❌ User has ${currentGoalCount} goals, max is ${maxGoals}. Deactivating ${goalsToDeactivate.length} newest goals.`);

        for (const goal of goalsToDeactivate) {
          const { error: deactivateError } = await supabaseAdmin
            .from('goals')
            .update({ is_active: false })
            .eq('id', goal.id);

          if (deactivateError) {
            console.error(`Error deactivating goal ${goal.id}:`, deactivateError);
          } else {
            console.log(`✅ Deactivated goal: "${goal.title}"`);
            totalFixed++;
          }
        }

        results.push({
          userId,
          email: `User ending in ...${userId.slice(-8)}`,
          isSubscribed,
          maxGoals,
          originalGoalCount: currentGoalCount,
          goalsDeactivated: goalsToDeactivate.length,
          goalsKept: goalsToKeep.map(g => g.title)
        });
      } else {
        console.log(`✅ User ${userId} is within limits (${currentGoalCount}/${maxGoals})`);
      }
    }

    console.log(`🎯 Goal limit enforcement complete. Fixed ${totalFixed} goals across ${results.length} users.`);

    return new Response(JSON.stringify({ 
      success: true,
      totalGoalsFixed: totalFixed,
      usersAffected: results.length,
      details: results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in fix-goal-limits function:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});