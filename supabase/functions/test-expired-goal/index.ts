import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🧪 Creating test expired goal to test Phase 2 skip logic');

    // Create an expired goal for dandlynn@yahoo.com
    const { data: expiredGoal, error: goalError } = await supabase
      .from('goals')
      .insert({
        user_id: 'dandlynn@yahoo.com',
        title: 'Test Expired Goal',
        description: 'This goal expired yesterday to test email skip logic',
        target_date: '2025-09-01', // Yesterday (expired)
        tone: 'kind_encouraging',
        time_of_day: '07:00',
        streak_count: 5,
        is_active: true
      })
      .select()
      .single();

    if (goalError) {
      throw new Error('Failed to create test expired goal: ' + goalError.message);
    }

    console.log('✅ Created test expired goal:', expiredGoal.id);

    // Now test the email system
    console.log('📧 Testing email system with expired goal...');
    
    const emailResponse = await supabase.functions.invoke('send-daily-emails', {
      body: { forceDelivery: true }
    });

    console.log('📧 Email system response:', emailResponse);

    // Clean up - delete the test goal
    await supabase
      .from('goals')
      .delete()
      .eq('id', expiredGoal.id);

    console.log('🧹 Cleaned up test expired goal');

    return new Response(JSON.stringify({
      success: true,
      message: 'Phase 2 test completed',
      testGoalId: expiredGoal.id,
      emailResponse: emailResponse.data,
      emailError: emailResponse.error
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});