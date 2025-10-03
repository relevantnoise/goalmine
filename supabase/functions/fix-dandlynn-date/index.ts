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
    console.log('🔧 EMERGENCY FIX: Updating dandlynn goal date from 2024 to 2025');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // First, let's see what goal we're dealing with
    const { data: goalData, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', '8MZNQ8sG1VfWaBd74A39jNzyZmL2')  // Firebase UID from earlier data
      .eq('id', 'dae2616f-dd2a-41ef-9b49-d90e5c310644');

    console.log('📊 Current goal data:', goalData);

    if (fetchError || !goalData || goalData.length === 0) {
      console.log('❌ Could not find goal, trying email approach');
      
      // Try with email approach
      const { data: emailGoalData, error: emailFetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', 'dandlynn@yahoo.com')
        .eq('id', 'dae2616f-dd2a-41ef-9b49-d90e5c310644');

      if (emailFetchError || !emailGoalData || emailGoalData.length === 0) {
        return new Response(JSON.stringify({
          error: 'Goal not found with either approach',
          fetchError: fetchError?.message,
          emailFetchError: emailFetchError?.message
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      // Use email-based goal
      const { data: updateResults, error: updateError } = await supabase
        .from('goals')
        .update({
          target_date: '2025-12-06',
          updated_at: new Date().toISOString()
        })
        .eq('id', 'dae2616f-dd2a-41ef-9b49-d90e5c310644')
        .eq('user_id', 'dandlynn@yahoo.com')
        .select();

      return new Response(JSON.stringify({
        success: !updateError,
        method: 'email-based-update',
        updateError: updateError?.message,
        updatedRows: updateResults?.length || 0,
        updatedGoal: updateResults?.[0]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: updateError ? 500 : 200,
      });
    }

    // Update using Firebase UID approach
    const { data: updateResults, error: updateError } = await supabase
      .from('goals')
      .update({
        target_date: '2025-12-06',
        updated_at: new Date().toISOString()
      })
      .eq('id', 'dae2616f-dd2a-41ef-9b49-d90e5c310644')
      .eq('user_id', '8MZNQ8sG1VfWaBd74A39jNzyZmL2')
      .select();

    console.log('📊 Update results:', updateResults);
    console.log('📊 Update error:', updateError);

    return new Response(JSON.stringify({
      success: !updateError,
      method: 'firebase-uid-update',
      updateError: updateError?.message,
      updatedRows: updateResults?.length || 0,
      updatedGoal: updateResults?.[0],
      originalGoal: goalData?.[0]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: updateError ? 500 : 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});