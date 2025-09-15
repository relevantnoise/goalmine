import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date().toISOString().split('T')[0]
    
    console.log(`=== EXACT DEBUG FOR DANDLYNN ===`)

    // Get dandlynn's specific goal by ID
    const goalId = '5e854f82-ba9f-46b8-b327-b70c91b97a80'
    const { data: goal, error: goalError } = await supabaseClient
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single()

    if (goalError || !goal) {
      return new Response(JSON.stringify({ error: 'Goal not found', goalError }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 
      })
    }

    console.log(`Goal found:`, goal)
    console.log(`Goal user_id: ${goal.user_id}`)
    console.log(`Goal user_id includes @: ${goal.user_id.includes('@')}`)

    // Exactly replicate the profile lookup logic from send-daily-emails
    let userProfile = null;
    let profileError = null;
    
    if (goal.user_id.includes('@')) {
      console.log(`Email-based goal - looking up profile by email: ${goal.user_id}`);
      const result = await supabaseClient
        .from('profiles')
        .select('email, trial_expires_at, created_at')
        .eq('email', goal.user_id)
        .single();
      userProfile = result.data;
      profileError = result.error;
    } else {
      console.log(`Firebase UID-based goal - looking up profile by ID: ${goal.user_id}`);
      const result = await supabaseClient
        .from('profiles')
        .select('email, trial_expires_at, created_at')
        .eq('id', goal.user_id)
        .single();
      userProfile = result.data;
      profileError = result.error;
    }

    console.log(`Profile lookup result:`, { userProfile, profileError });

    // Apply the exact same fallback logic
    let profile;
    if (userProfile) {
      profile = userProfile;
    } else if (goal.user_id.includes('@')) {
      profile = { email: goal.user_id, trial_expires_at: null };
    } else {
      console.error(`No profile found for Firebase UID goal ${goal.title}: ${goal.user_id}`);
      return new Response(JSON.stringify({ 
        error: 'No profile found for Firebase UID goal',
        goal: goal,
        profileError: profileError 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
      })
    }
    
    console.log(`Final profile:`, profile);

    // Check the email validation
    const emailValid = profile.email && profile.email.includes('@')
    console.log(`Email valid: ${emailValid}`)

    if (!emailValid) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email',
        profile: profile,
        email: profile.email
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
      })
    }

    // Test the exact email function call that would be made
    const testEmailCall = {
      email: profile.email,
      name: profile.email.split('@')[0],
      goal: goal.title,
      message: 'Test message for exact debugging',
      microPlan: 'Test step 1\nTest step 2\nTest step 3',
      challenge: 'Test challenge',
      streak: goal.streak_count,
      redirectUrl: 'https://goalmine.ai',
      isNudge: false,
      userId: goal.user_id,
      goalId: goal.id
    }

    console.log(`Would call send-motivation-email with:`, testEmailCall)

    // Actually try the email call
    const emailResponse = await supabaseClient.functions.invoke('send-motivation-email', {
      body: testEmailCall
    });

    console.log(`Email response:`, emailResponse)

    return new Response(
      JSON.stringify({
        goal: goal,
        profile_lookup: { userProfile, profileError },
        final_profile: profile,
        email_valid: emailValid,
        email_call_body: testEmailCall,
        email_response: emailResponse,
        success: !emailResponse.error,
        timestamp: new Date().toISOString()
      }, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})