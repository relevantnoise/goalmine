import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🧪 Testing simple save operation...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const userEmail = 'danlynn@gmail.com'
    
    // Step 1: Test profile lookup
    console.log('👤 Testing profile lookup...')
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('email', userEmail)
      .single()

    if (profileError) {
      console.error('❌ Profile lookup failed:', profileError)
      throw new Error(`Profile lookup failed: ${profileError.message}`)
    }

    console.log('✅ Profile found:', profile)
    const userId = profile.user_id

    // Step 2: Test framework creation
    console.log('📋 Testing framework creation...')
    const { data: framework, error: frameworkError } = await supabaseClient
      .from('user_frameworks')
      .insert({
        user_id: userId,
        onboarding_completed: true,
        is_active: true
      })
      .select()
      .single()

    if (frameworkError) {
      console.error('❌ Framework creation failed:', frameworkError)
      throw new Error(`Framework creation failed: ${frameworkError.message}`)
    }

    console.log('✅ Framework created:', framework.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test completed successfully',
        userId,
        frameworkId: framework.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Test failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})