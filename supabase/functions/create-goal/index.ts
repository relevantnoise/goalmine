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
      time_of_day,
      circle_type,
      weekly_commitment_hours,
      circle_interview_data
    } = requestBody;

    console.log('🎯 Creating goal for user:', user_id);
    console.log('🎯 Goal data:', { title, description, target_date, tone, time_of_day, circle_type, weekly_commitment_hours });

    if (!user_id || !title || !tone || !time_of_day) {
      throw new Error('Missing required fields: user_id, title, tone, time_of_day');
    }

    // HYBRID: Look up profile by email to get Firebase UID (proper architecture)
    console.log('🔍 Looking up profile by email to get Firebase UID:', user_id);
    const { data: userProfileResults, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', user_id);
    
    const userProfile = userProfileResults && userProfileResults.length > 0 ? userProfileResults[0] : null;

    if (profileError) {
      console.error('❌ Error looking up user profile:', profileError);
      throw new Error('Failed to find user profile');
    }

    if (!userProfile) {
      console.error('❌ No profile found for email:', user_id);
      throw new Error('User profile not found. Please sign in again to sync your profile.');
    }

    const actualUserId = userProfile.id; // Firebase UID
    console.log('✅ Found profile - Email:', userProfile.email, 'Firebase UID:', actualUserId);

    // HYBRID: Check existing goals using BOTH approaches to count properly
    console.log('🔍 HYBRID: Checking existing goals using both email and Firebase UID approaches');
    
    const [goalsByEmail, goalsByUID] = await Promise.all([
      // Check goals with email as user_id (OLD architecture)
      supabaseAdmin
        .from('goals')
        .select('id')
        .eq('user_id', user_id)
        .eq('is_active', true),
      // Check goals with Firebase UID as user_id (NEW architecture)  
      supabaseAdmin
        .from('goals')
        .select('id')
        .eq('user_id', actualUserId)
        .eq('is_active', true)
    ]);

    if (goalsByEmail.error) {
      console.error('❌ Error checking email-based goals:', goalsByEmail.error);
      throw new Error('Failed to check existing goals');
    }
    
    if (goalsByUID.error) {
      console.error('❌ Error checking UID-based goals:', goalsByUID.error);
      throw new Error('Failed to check existing goals');
    }

    // Combine and deduplicate goals
    const emailGoalIds = new Set(goalsByEmail.data?.map(g => g.id) || []);
    const uidGoalIds = new Set(goalsByUID.data?.map(g => g.id) || []);
    const allGoalIds = new Set([...emailGoalIds, ...uidGoalIds]);
    const currentGoalCount = allGoalIds.size;
    console.log('📊 Total goal count for user:', currentGoalCount);

    // Check subscription status using email (subscribers table uses email as user_id)
    const { data: subscriberResults, error: subError } = await supabaseAdmin
      .from('subscribers')
      .select('subscribed')
      .eq('user_id', user_id); // Keep using email for subscribers table
    
    const subscriber = subscriberResults && subscriberResults.length > 0 ? subscriberResults[0] : null;

    // Default to free user if no subscriber record found or error occurred
    const isSubscribed = subscriber?.subscribed === true;
    
    if (subError && subError.code !== 'PGRST116') {
      console.log('⚠️ Error checking subscription status:', subError);
    } else if (!subscriber) {
      console.log('📝 No subscriber record found - treating as free user');
    }
    // Determine max goals based on subscription tier
    const getMaxGoals = (subscriber) => {
      if (!subscriber?.subscribed) return 1; // Free users
      
      const tier = subscriber.subscription_tier;
      if (tier === 'Pro Plan') return 5;
      if (tier === 'Strategic Advisor Plan') return 5;
      if (tier === 'Professional Coach') return 5; // Legacy tier
      return 3; // Personal Plan (default for subscribed users)
    };
    
    const maxGoals = getMaxGoals(subscriber);
    
    console.log('💳 User subscription status:', { isSubscribed, maxGoals, currentGoalCount });

    if (currentGoalCount >= maxGoals) {
      const getErrorMessage = (subscriber, currentCount) => {
        if (!subscriber?.subscribed) {
          return `Free users can have a maximum of 1 goal. Upgrade to Personal Plan to create up to 3 goals.`;
        }
        
        const tier = subscriber.subscription_tier || 'Personal Plan';
        
        if (tier === 'Personal Plan') {
          return `Personal Plan users can have a maximum of 3 goals. Upgrade to Pro Plan to create up to 5 goals.`;
        }
        
        // Pro Plan, Strategic Advisor Plan, and Professional Coach (legacy) - no upgrade available
        const maxForTier = tier === 'Pro Plan' || tier === 'Strategic Advisor Plan' || tier === 'Professional Coach' ? 5 : 3;
        return `${tier} users can have a maximum of ${maxForTier} goals. You currently have ${currentCount} goals.`;
      };
      
      const errorMessage = getErrorMessage(subscriber, currentGoalCount);
      
      console.log('❌ Goal limit reached:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ Goal limit check passed, proceeding with creation');

    // Insert the goal using service role (bypasses RLS)  
    // Use Firebase UID for proper architecture consistency
    const goalToInsert = {
      user_id: actualUserId, // Use Firebase UID for consistency with existing goals
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