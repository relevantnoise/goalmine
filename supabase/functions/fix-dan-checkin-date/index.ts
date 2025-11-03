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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log('🔧 FIX: Correcting danlynn@gmail.com invalid check-in date');

    // Get the goal with invalid date
    const { data: goal } = await supabase
      .from('goals')
      .select('*')
      .eq('id', '543c54d8-b8ef-42d0-b7b3-b7bef4e6b67d')
      .single();

    if (!goal) {
      throw new Error('Goal not found');
    }

    console.log('Current goal data:', {
      id: goal.id,
      title: goal.title,
      last_checkin_date: goal.last_checkin_date,
      streak_count: goal.streak_count
    });

    // The issue: last_checkin_date is "2025-11-03" (just date) instead of full timestamp
    // This breaks the timezone calculations in check-in function
    
    // Since the user checked in today but with bad date format, let's:
    // 1. Reset to yesterday's date to allow today's check-in
    // 2. Use proper timestamp format
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(15, 0, 0, 0); // 3 PM yesterday, well before 3 AM reset
    
    const { data: updatedGoal, error: updateError } = await supabase
      .from('goals')
      .update({
        last_checkin_date: yesterday.toISOString(), // Proper timestamp format
        streak_count: goal.streak_count - 1, // Reduce by 1 since we're "undoing" today's checkin
        updated_at: new Date().toISOString()
      })
      .eq('id', goal.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const result = {
      success: true,
      message: 'Fixed check-in date format issue',
      before: {
        last_checkin_date: goal.last_checkin_date,
        streak_count: goal.streak_count,
        format: 'Invalid date-only format'
      },
      after: {
        last_checkin_date: updatedGoal.last_checkin_date,
        streak_count: updatedGoal.streak_count,
        format: 'Proper ISO timestamp'
      },
      action: 'Reset to yesterday to allow todays check-in with proper 3 AM reset logic'
    };

    console.log('✅ FIX COMPLETED:', result);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ FIX ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});