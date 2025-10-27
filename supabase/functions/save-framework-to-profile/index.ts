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
    console.log('[PROFILE-FRAMEWORK] Emergency workaround - saving to profiles table');
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables');
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    const { user_email, circleAllocations, workHappiness } = await req.json()

    console.log('🎯 Emergency: Saving framework data to profile for:', user_email)

    // Save framework data as JSON in the profiles table
    const frameworkData = {
      completed_at: new Date().toISOString(),
      circle_allocations: circleAllocations,
      work_happiness: workHappiness,
      framework_type: '6_elements_of_life',
      version: '1.0'
    };

    // Update the user's profile with framework data
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        framework_data: frameworkData,
        updated_at: new Date().toISOString()
      })
      .eq('email', user_email);

    if (updateError) {
      console.error('❌ Profile update failed:', updateError);
      throw new Error(`Profile update failed: ${updateError.message}`);
    }

    console.log('✅ Framework data saved to profile successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: '6 Elements of Life™ framework saved successfully!',
        method: 'profile_workaround'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 PROFILE FRAMEWORK ERROR:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Emergency profile framework save failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})