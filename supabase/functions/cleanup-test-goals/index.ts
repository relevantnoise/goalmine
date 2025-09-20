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
    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log('🧹 Cleaning up test goals for dandlynn@yahoo.com...');

    // Get all goals for dandlynn@yahoo.com ordered by creation date
    const { data: allGoals, error: fetchError } = await supabase
      .from('goals')
      .select('id, title, created_at, is_active')
      .eq('user_id', 'dandlynn@yahoo.com')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Error fetching goals: ${fetchError.message}`);
    }

    console.log('📋 Found goals:', allGoals?.map(g => ({ id: g.id, title: g.title, is_active: g.is_active })));

    if (!allGoals || allGoals.length <= 1) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: `User has ${allGoals?.length || 0} goals, no cleanup needed` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Keep the most recent goal active, deactivate all others
    const mostRecentGoal = allGoals[0];
    const goalsToDeactivate = allGoals.slice(1).map(g => g.id);

    console.log('✅ Keeping active:', mostRecentGoal.title);
    console.log('❌ Deactivating:', goalsToDeactivate.length, 'goals');

    // Deactivate old goals
    const { error: updateError } = await supabase
      .from('goals')
      .update({ is_active: false })
      .in('id', goalsToDeactivate);

    if (updateError) {
      throw new Error(`Error deactivating goals: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Kept 1 goal active, deactivated ${goalsToDeactivate.length} goals`,
      activeGoal: mostRecentGoal.title,
      deactivatedCount: goalsToDeactivate.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});