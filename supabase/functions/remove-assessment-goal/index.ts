import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[REMOVE-ASSESSMENT-GOAL] Starting removal of assessment goal');
    
    const email = 'danlynn@gmail.com';
    
    // Find the specific assessment goal
    const { data: assessmentGoal } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', email)
      .eq('title', '🎯 6 Elements of Life™ Framework Complete')
      .single();
    
    if (!assessmentGoal) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Assessment goal not found',
        timestamp: new Date().toISOString()
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    console.log('[REMOVE-ASSESSMENT-GOAL] Found assessment goal:', assessmentGoal);
    
    // SAFETY CHECK: Only delete if it's the specific assessment goal
    if (!assessmentGoal.title.includes('6 Elements of Life™ Framework')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Safety check failed - not an assessment goal',
        goal: assessmentGoal,
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    // Delete the assessment goal and related motivation history
    const { error: deleteGoalError } = await supabase
      .from('goals')
      .delete()
      .eq('id', assessmentGoal.id)
      .eq('user_id', email); // Double safety check
    
    if (deleteGoalError) {
      throw new Error(`Failed to delete goal: ${deleteGoalError.message}`);
    }
    
    // Clean up related motivation history
    const { error: deleteMotivationError } = await supabase
      .from('motivation_history')
      .delete()
      .eq('goal_id', assessmentGoal.id);
    
    if (deleteMotivationError) {
      console.warn('[REMOVE-ASSESSMENT-GOAL] Warning: Could not delete motivation history:', deleteMotivationError);
    }
    
    // Verify removal
    const { data: remainingGoals } = await supabase
      .from('goals')
      .select('*')
      .or(`user_id.eq.${email},user_id.eq.bnW61Z1dJyWjSNWBR5oulCZdfcl2`)
      .eq('is_active', true);
    
    const result = {
      success: true,
      message: 'Assessment goal successfully removed',
      deletedGoal: assessmentGoal,
      remainingActiveGoals: remainingGoals?.length || 0,
      remainingGoals: remainingGoals || [],
      timestamp: new Date().toISOString()
    };
    
    console.log('[REMOVE-ASSESSMENT-GOAL] Removal complete:', result);
    
    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[REMOVE-ASSESSMENT-GOAL] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);