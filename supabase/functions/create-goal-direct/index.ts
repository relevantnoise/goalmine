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
    // Parse request
    const body = await req.json();
    console.log('📥 Received goal creation request:', JSON.stringify(body, null, 2));
    
    const { user_id, title, description, target_date, tone, time_of_day } = body;

    // Validation
    if (!user_id || !title || !tone || !time_of_day) {
      console.error('❌ Missing required fields');
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required fields: user_id, title, tone, time_of_day" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log('✅ Validation passed for user:', user_id);

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // CHECK SUBSCRIPTION LIMITS FIRST
    console.log('🔍 Checking subscription limits for user:', user_id);
    
    // Get user's subscription status
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('user_id, plan_name, status')
      .eq('user_id', user_id)
      .single();

    const isSubscribed = subscriber && subscriber.status === 'active';
    console.log('💳 Subscription status:', { isSubscribed, plan: subscriber?.plan_name });

    // Count existing active goals
    const { count: goalCount, error: countError } = await supabase
      .from('goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (countError) {
      console.error('❌ Error counting goals:', countError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to check existing goals: ${countError.message}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const maxGoals = isSubscribed ? 3 : 1;
    console.log('📊 Goal limits check:', { currentGoals: goalCount, maxGoals, canCreate: (goalCount || 0) < maxGoals });

    if ((goalCount || 0) >= maxGoals) {
      console.log('❌ User has reached goal limit');
      return new Response(JSON.stringify({ 
        success: false, 
        error: isSubscribed 
          ? `Premium users are limited to ${maxGoals} goals. Delete an existing goal first.`
          : `Free users are limited to ${maxGoals} goal. Upgrade to Personal Plan for up to 3 goals.`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Insert goal directly (service role bypasses RLS)
    console.log('📝 Inserting goal into database...');
    const { data, error } = await supabase
      .from('goals')
      .insert([{
        user_id,
        title,
        description: description || null,
        target_date: target_date || null,
        tone,
        time_of_day,
        streak_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Database error: ${error.message}`,
        code: error.code,
        details: error.details
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log('✅ Goal created successfully:', data.id);

    return new Response(JSON.stringify({ 
      success: true, 
      goal: data 
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