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
    console.log('[CREATE-GOAL] Function started, method:', req.method);
    
    // Check environment variables first
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log('[CREATE-GOAL] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      urlPrefix: supabaseUrl?.substring(0, 20) + '...'
    });
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    // Use service role key to bypass RLS
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    console.log('[CREATE-GOAL] Supabase client created');
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('[CREATE-GOAL] Request body parsed:', requestBody);
    } catch (parseError) {
      console.error('[CREATE-GOAL] Error parsing request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { 
      user_id, 
      title, 
      description, 
      target_date, 
      tone, 
      time_of_day 
    } = requestBody;

    console.log('🎯 Creating goal for user:', user_id);
    console.log('🎯 Goal data:', { title, description, target_date, tone, time_of_day });

    if (!user_id || !title || !tone || !time_of_day) {
      throw new Error('Missing required fields: user_id, title, tone, time_of_day');
    }

    // Check current goal count and subscription status
    console.log('🔍 Checking existing goals for user:', user_id);
    
    const { data: existingGoals, error: goalsError } = await supabaseAdmin
      .from('goals')
      .select('id')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (goalsError) {
      console.error('❌ Error checking existing goals:', goalsError);
      throw new Error('Failed to check existing goals');
    }

    const currentGoalCount = existingGoals?.length || 0;
    console.log('📊 Current goal count for user:', currentGoalCount);

    // Check subscription status (handle case where no subscriber record exists)
    const { data: subscriber, error: subError } = await supabaseAdmin
      .from('subscribers')
      .select('subscribed')
      .eq('user_id', user_id)
      .maybeSingle(); // Use maybeSingle() to avoid errors when no record exists

    // Default to free user if no subscriber record found or error occurred
    const isSubscribed = subscriber?.subscribed === true;
    
    if (subError && subError.code !== 'PGRST116') {
      console.log('⚠️ Error checking subscription status:', subError);
    } else if (!subscriber) {
      console.log('📝 No subscriber record found - treating as free user');
    }
    const maxGoals = isSubscribed ? 3 : 1;
    
    console.log('💳 User subscription status:', { isSubscribed, maxGoals, currentGoalCount });

    if (currentGoalCount >= maxGoals) {
      const errorMessage = isSubscribed 
        ? `Premium users can have a maximum of 3 goals. You currently have ${currentGoalCount} goals.`
        : `Free users can have a maximum of 1 goal. Upgrade to Premium to create up to 3 goals.`;
      
      console.log('❌ Goal limit reached:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ Goal limit check passed, proceeding with creation');

    // Insert the goal using service role (bypasses RLS)  
    // Only specify required fields, let database handle defaults
    const goalToInsert = {
      user_id,
      title,
      description: description || null,
      target_date: target_date ? target_date.split('T')[0] : null, // Ensure date format
      tone,
      time_of_day,
      is_active: true
    };
    
    console.log('🔄 About to insert goal:', goalToInsert);
    
    const { data, error } = await supabaseAdmin
      .from('goals')
      .insert([goalToInsert])
      .select()
      .single();

    if (error) {
      console.error('❌ DATABASE ERROR creating goal:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      console.error('❌ No data returned from database insertion');
      throw new Error('Goal insertion succeeded but no data returned');
    }

    console.log('✅ Goal created successfully:', data.id);
    console.log('✅ Full created goal:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      goal: data 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in create-goal function:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});