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
    const { goalId, userId } = body;

    console.log('🗑️ Deleting goal:', goalId, 'for user:', userId);

    if (!goalId || !userId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields: goalId, userId"
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

    // First, delete related motivation_history records (foreign key constraint)
    console.log('🗑️ Deleting motivation history for goal:', goalId);
    const { error: motivationError } = await supabase
      .from('motivation_history')
      .delete()
      .eq('goal_id', goalId)
      .eq('user_id', userId);

    if (motivationError) {
      console.error('❌ Error deleting motivation history:', motivationError);
      // Continue anyway - motivation history might not exist
    }

    // Delete the goal using service role
    console.log('🗑️ Deleting goal from database:', goalId);
    const { data, error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

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

    console.log('✅ Goal deleted successfully:', goalId);

    return new Response(JSON.stringify({
      success: true,
      deletedGoal: data,
      message: "Goal deleted successfully"
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