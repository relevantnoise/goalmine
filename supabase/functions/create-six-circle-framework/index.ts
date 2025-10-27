import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[6-ELEMENTS] Function started, method:', req.method);
    
    // Check environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log('[6-ELEMENTS] Environment check:', {
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

    console.log('[6-ELEMENTS] Supabase client created');

    const { user_email, circleAllocations, workHappiness } = await req.json()

    console.log('🎯 Creating 6 Elements of Life for:', user_email)

    // HYBRID: Look up profile by email to get Firebase UID (same as create-goal)
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

    console.log('✅ Found profile - Email:', userProfile.email, 'Firebase UID:', userProfile.id);

    // 1. Create framework record using direct SQL query
    console.log('📝 Step 1: Creating 6 Elements of Life record...')
    const { data: frameworkData, error: frameworkError } = await supabaseAdmin
      .from('user_circle_frameworks')
      .insert({
        user_email,
        work_hours_per_week: 40,
        sleep_hours_per_night: 8,
        commute_hours_per_week: 5,
        available_hours_per_week: 115
      })
      .select('id')
      .single();

    if (frameworkError) {
      console.error('❌ Framework creation failed:', frameworkError)
      throw new Error(`Framework creation failed: ${frameworkError.message}`)
    }

    const framework = frameworkData;
    
    console.log('✅ 6 Elements of Life created:', framework.id)

    // 2. Create element allocations
    console.log('📝 Step 2: Creating 6 element allocations...')
    const circleInserts = Object.values(circleAllocations).map(allocation => ({
      framework_id: framework.id,
      circle_name: allocation.circle_name,
      importance_level: allocation.importance_level,
      current_hours_per_week: allocation.current_hours_per_week,
      ideal_hours_per_week: allocation.ideal_hours_per_week
    }));

    const { error: circleError } = await supabaseAdmin
      .from('circle_time_allocations')
      .insert(circleInserts);

    if (circleError) {
      console.error('❌ Circle allocations failed:', circleError)
      throw new Error(`Circle allocations failed: ${circleError.message}`)
    }

    console.log('✅ 6 Element allocations created:', circleInserts.length)

    // 3. Create work happiness metrics
    console.log('📝 Step 3: Creating work happiness metrics...')
    const { error: happinessError } = await supabaseAdmin
      .from('work_happiness_metrics')
      .insert({
        framework_id: framework.id,
        impact_current: workHappiness.impact_current,
        impact_desired: workHappiness.impact_desired,
        fun_current: workHappiness.fun_current,
        fun_desired: workHappiness.fun_desired,
        money_current: workHappiness.money_current,
        money_desired: workHappiness.money_desired,
        remote_current: workHappiness.remote_current,
        remote_desired: workHappiness.remote_desired
      });

    if (happinessError) {
      console.error('❌ Work happiness failed:', happinessError)
      throw new Error(`Work happiness creation failed: ${happinessError.message}`)
    }

    console.log('✅ Work happiness metrics created')
    console.log('🎯 6 ELEMENTS OF LIFE CREATION COMPLETE!')

    return new Response(
      JSON.stringify({
        success: true,
        framework_id: framework.id,
        message: '6 Elements of Life™ created successfully!',
        circles_count: circleInserts.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 6 ELEMENTS OF LIFE ERROR:', error)
    console.error('💥 Error details:', error.message)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: '6 Elements of Life creation failed',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})