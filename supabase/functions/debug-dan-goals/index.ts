import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const email = 'danlynn@gmail.com';
    
    console.log('🔍 Debug: Investigating goals for danlynn@gmail.com');

    // Get profile first
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email);
    
    console.log('👤 Profile data:', profileData);
    if (profileError) console.error('Profile error:', profileError);

    const firebaseUID = profileData && profileData.length > 0 ? profileData[0].id : null;
    console.log('🔑 Firebase UID:', firebaseUID);

    // Check goals by email (old architecture)
    const { data: emailGoals, error: emailError } = await supabaseAdmin
      .from('goals')
      .select('id, title, description, is_active, created_at, circle_type')
      .eq('user_id', email);
    
    console.log('📧 Goals by email:', emailGoals);
    if (emailError) console.error('Email goals error:', emailError);

    // Check goals by Firebase UID (new architecture)
    let uidGoals = [];
    if (firebaseUID) {
      const { data: uidGoalsData, error: uidError } = await supabaseAdmin
        .from('goals')
        .select('id, title, description, is_active, created_at, circle_type')
        .eq('user_id', firebaseUID);
      
      uidGoals = uidGoalsData || [];
      console.log('🔑 Goals by UID:', uidGoals);
      if (uidError) console.error('UID goals error:', uidError);
    }

    // Check 6 Elements frameworks
    const { data: frameworkData, error: frameworkError } = await supabaseAdmin
      .from('six_elements_frameworks')
      .select('*')
      .eq('user_id', firebaseUID || email);
    
    console.log('🎯 6 Elements frameworks:', frameworkData);
    if (frameworkError) console.error('Framework error:', frameworkError);

    // Check subscription status
    const { data: subscriberData, error: subError } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .eq('user_id', email);
    
    console.log('💳 Subscription data:', subscriberData);
    if (subError) console.error('Subscription error:', subError);

    // Summary
    const totalGoals = (emailGoals || []).length + uidGoals.length;
    const allGoals = [...(emailGoals || []), ...uidGoals];
    
    const summary = {
      email,
      firebaseUID,
      totalGoalsFound: totalGoals,
      goalsByEmail: emailGoals?.length || 0,
      goalsByUID: uidGoals.length,
      hasFramework: (frameworkData && frameworkData.length > 0),
      subscriptionStatus: subscriberData && subscriberData.length > 0 ? subscriberData[0] : null,
      allGoalTitles: allGoals.map(g => g.title),
      goalDetails: allGoals
    };

    console.log('📋 SUMMARY:', summary);

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('🚨 Debug error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to debug dan goals'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})