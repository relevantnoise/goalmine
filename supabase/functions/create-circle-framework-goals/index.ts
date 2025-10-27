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
    console.log('[CREATE-CIRCLE-FRAMEWORK-GOALS] Function started, method:', req.method);
    
    // Use same environment setup as goal creation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    // Use service role key to bypass RLS (SAME AS GOAL CREATION)
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    const requestBody = await req.json();
    const { user_email, timeContext, circleAllocations, workHappiness } = requestBody;

    console.log('🎯 Creating circle framework using goals table for user:', user_email);

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

    if (profileError || !userProfile) {
      throw new Error('User profile not found. Please sign in again to sync your profile.');
    }

    const actualUserId = userProfile.id; // Firebase UID
    console.log('✅ Found profile - Email:', userProfile.email, 'Firebase UID:', actualUserId);

    // Store circle framework as special metadata records in goals table
    const frameworkRecords = [];
    
    // 1. Time context record
    frameworkRecords.push({
      user_id: actualUserId,
      title: '⚙️ Time Framework',
      description: `Work: ${timeContext.work_hours_per_week}h/week | Sleep: ${timeContext.sleep_hours_per_night}h/night | Commute: ${timeContext.commute_hours_per_week}h/week | Available: ${timeContext.available_hours_per_week}h/week`,
      tone: 'framework_data',
      time_of_day: '00:00',
      is_active: false, // Special flag: not a real goal
      circle_type: '_FRAMEWORK_TIME_CONTEXT',
      circle_interview_data: timeContext
    });

    // 2. Circle allocation records (one per circle)
    Object.values(circleAllocations).forEach(allocation => {
      frameworkRecords.push({
        user_id: actualUserId,
        title: `🎯 ${allocation.circle_name} Circle`,
        description: `Importance: ${allocation.importance_level}/10 | Current: ${allocation.current_hours_per_week}h/week | Ideal: ${allocation.ideal_hours_per_week}h/week`,
        tone: 'framework_data',
        time_of_day: '00:00',
        is_active: false, // Special flag: not a real goal
        circle_type: allocation.circle_name,
        weekly_commitment_hours: allocation.ideal_hours_per_week,
        circle_interview_data: allocation
      });
    });

    // 3. Work happiness record
    frameworkRecords.push({
      user_id: actualUserId,
      title: '💼 Work Happiness Framework',
      description: `Impact: ${workHappiness.impact_current}→${workHappiness.impact_desired} | Fun: ${workHappiness.fun_current}→${workHappiness.fun_desired} | Money: ${workHappiness.money_current}→${workHappiness.money_desired} | Remote: ${workHappiness.remote_current}→${workHappiness.remote_desired}`,
      tone: 'framework_data',
      time_of_day: '00:00',
      is_active: false, // Special flag: not a real goal
      circle_type: '_FRAMEWORK_WORK_HAPPINESS',
      circle_interview_data: workHappiness
    });

    console.log('🔄 About to insert framework records into goals table:', frameworkRecords.length);
    
    // Insert all framework records using the proven goals table infrastructure
    const { data: insertedRecords, error: insertError } = await supabaseAdmin
      .from('goals')
      .insert(frameworkRecords)
      .select();

    if (insertError) {
      console.error('❌ DATABASE ERROR creating framework records:', insertError);
      throw new Error(`Database error creating framework: ${insertError.message}`);
    }

    if (!insertedRecords || insertedRecords.length === 0) {
      throw new Error('Framework insertion succeeded but no data returned');
    }

    console.log('✅ Circle framework created successfully as goal records:', insertedRecords.length);

    return new Response(JSON.stringify({ 
      success: true, 
      framework_id: `framework_${actualUserId}_${Date.now()}`,
      records_created: insertedRecords.length,
      message: 'Circle framework created successfully using proven goals infrastructure!'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in create-circle-framework-goals function:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});