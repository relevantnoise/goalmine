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
    console.log('[CREATE-CIRCLE-FRAMEWORK] Function started, method:', req.method);
    
    // Check environment variables first (SAME AS GOAL CREATION)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log('[CREATE-CIRCLE-FRAMEWORK] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      urlPrefix: supabaseUrl?.substring(0, 20) + '...'
    });
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    // Use service role key to bypass RLS (SAME AS GOAL CREATION)
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    console.log('[CREATE-CIRCLE-FRAMEWORK] Supabase client created');
    
    // Parse request body (SAME AS GOAL CREATION)
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('[CREATE-CIRCLE-FRAMEWORK] Request body parsed:', requestBody);
    } catch (parseError) {
      console.error('[CREATE-CIRCLE-FRAMEWORK] Error parsing request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { user_email, timeContext, circleAllocations, workHappiness } = requestBody;

    console.log('🎯 Creating circle framework for user:', user_email);
    console.log('🎯 Framework data:', { timeContext, circleAllocations, workHappiness });

    if (!user_email || !timeContext || !circleAllocations || !workHappiness) {
      throw new Error('Missing required fields: user_email, timeContext, circleAllocations, workHappiness');
    }

    // HYBRID: Look up profile by email to get Firebase UID (SAME AS GOAL CREATION)
    console.log('🔍 Looking up profile by email to get Firebase UID:', user_email);
    const { data: userProfileResults, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', user_email);
    
    const userProfile = userProfileResults && userProfileResults.length > 0 ? userProfileResults[0] : null;

    if (profileError) {
      console.error('❌ Error looking up user profile:', profileError);
      throw new Error('Failed to find user profile');
    }

    if (!userProfile) {
      console.error('❌ No profile found for email:', user_email);
      throw new Error('User profile not found. Please sign in again to sync your profile.');
    }

    const actualUserId = userProfile.id; // Firebase UID
    console.log('✅ Found profile - Email:', userProfile.email, 'Firebase UID:', actualUserId);

    // Check if framework already exists (prevent duplicates)
    console.log('🔍 Checking for existing framework...');
    const { data: existingFrameworks, error: existingError } = await supabaseAdmin
      .from('user_circle_frameworks')
      .select('id')
      .eq('user_email', user_email);

    if (existingError) {
      console.log('⚠️ Error checking existing framework (table might not exist):', existingError);
      // Continue anyway - we'll create tables if needed
    }

    if (existingFrameworks && existingFrameworks.length > 0) {
      console.log('📊 Existing framework found, will update instead of create');
      // For now, let's still create new - later we can add update logic
    }

    // 1. Insert the framework using service role (bypasses RLS) - SAME PATTERN AS GOAL CREATION
    const frameworkToInsert = {
      user_email,
      work_hours_per_week: timeContext.work_hours_per_week,
      sleep_hours_per_night: timeContext.sleep_hours_per_night,
      commute_hours_per_week: timeContext.commute_hours_per_week,
      available_hours_per_week: timeContext.available_hours_per_week
    };
    
    console.log('🔄 About to insert framework:', frameworkToInsert);
    
    const { data: framework, error: frameworkError } = await supabaseAdmin
      .from('user_circle_frameworks')
      .insert([frameworkToInsert])
      .select()
      .single();

    if (frameworkError) {
      console.error('❌ DATABASE ERROR creating framework:', frameworkError);
      console.error('❌ Full error details:', JSON.stringify(frameworkError, null, 2));
      throw new Error(`Database error creating framework: ${frameworkError.message}`);
    }

    if (!framework) {
      console.error('❌ No data returned from framework insertion');
      throw new Error('Framework insertion succeeded but no data returned');
    }

    console.log('✅ Framework created successfully:', framework.id);

    // 2. Insert circle allocations
    const circleInsertsData = Object.values(circleAllocations).map(allocation => ({
      framework_id: framework.id,
      circle_name: allocation.circle_name,
      importance_level: allocation.importance_level,
      current_hours_per_week: allocation.current_hours_per_week,
      ideal_hours_per_week: allocation.ideal_hours_per_week
    }));

    console.log('🔄 About to insert circle allocations:', circleInsertsData);

    const { data: circles, error: circleError } = await supabaseAdmin
      .from('circle_time_allocations')
      .insert(circleInsertsData)
      .select();

    if (circleError) {
      console.error('❌ DATABASE ERROR creating circle allocations:', circleError);
      throw new Error(`Database error creating circle allocations: ${circleError.message}`);
    }

    console.log('✅ Circle allocations created successfully:', circles?.length);

    // 3. Insert work happiness metrics
    const happinessToInsert = {
      framework_id: framework.id,
      impact_current: workHappiness.impact_current,
      impact_desired: workHappiness.impact_desired,
      fun_current: workHappiness.fun_current,
      fun_desired: workHappiness.fun_desired,
      money_current: workHappiness.money_current,
      money_desired: workHappiness.money_desired,
      remote_current: workHappiness.remote_current,
      remote_desired: workHappiness.remote_desired
    };

    console.log('🔄 About to insert work happiness:', happinessToInsert);

    const { data: happiness, error: happinessError } = await supabaseAdmin
      .from('work_happiness_metrics')
      .insert([happinessToInsert])
      .select()
      .single();

    if (happinessError) {
      console.error('❌ DATABASE ERROR creating work happiness:', happinessError);
      throw new Error(`Database error creating work happiness: ${happinessError.message}`);
    }

    console.log('✅ Work happiness metrics created successfully:', happiness.id);
    console.log('✅ Full circle framework created successfully!');

    return new Response(JSON.stringify({ 
      success: true, 
      framework_id: framework.id,
      message: 'Circle framework created successfully using proven goal creation pattern!'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in create-circle-framework-working function:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});