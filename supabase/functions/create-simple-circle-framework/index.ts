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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_email, timeContext, circleAllocations, workHappiness } = await req.json()

    console.log('🎯 Creating 6 Pillars framework for:', user_email)
    console.log('📊 Data received:', { timeContext, circleAllocations, workHappiness })

    // Get user ID (hybrid system: try Firebase UID first, fallback to email)
    let userId = user_email; // Default fallback
    
    try {
      const { data: existingProfile, error: fetchError } = await supabaseClient
        .from('profiles')
        .select('id, email')
        .eq('email', user_email)
        .single()

      if (!fetchError && existingProfile?.id) {
        userId = existingProfile.id; // Use Firebase UID if available
        console.log('🆔 Found Firebase UID for user:', userId);
      } else {
        console.log('🆔 Using email as user_id (hybrid fallback):', user_email);
      }
    } catch (profileError) {
      console.log('🆔 Profile lookup failed, using email as user_id:', user_email);
    }

    // 1. Create the main framework record using correct table name
    console.log('📋 Creating framework instance in user_frameworks...')
    const { data: framework, error: frameworkError } = await supabaseClient
      .from('user_frameworks')
      .insert({
        user_id: userId,
        user_email: user_email, // Add for easy lookup
        onboarding_completed: true,
        is_active: true
      })
      .select()
      .single()

    if (frameworkError) {
      console.error('❌ Framework creation error:', frameworkError)
      throw frameworkError
    }

    console.log('✅ Framework created:', framework.id)

    // 2. Create framework elements (pillars) using correct table structure
    console.log('📝 Saving framework elements...')
    const elementInserts = Object.values(circleAllocations).map((allocation: any) => ({
      framework_id: framework.id,
      element_name: allocation.circle_name, // Map circle_name to element_name
      current_state: allocation.importance_level || 5, // Map importance to current_state
      desired_state: (allocation.importance_level || 5) + 2, // Assume desired is higher
      weekly_hours: allocation.current_hours_per_week || 0, // Current hours
      personal_definition: null // Will be filled later
    }))

    const { error: elementsError } = await supabaseClient
      .from('framework_elements')
      .insert(elementInserts)

    if (elementsError) {
      console.error('❌ Elements creation error:', elementsError)
      throw elementsError
    }

    console.log('✅ Framework elements created:', elementInserts.length)

    // 3. Create work happiness data using correct table structure
    console.log('💼 Saving work happiness data...')
    const { error: happinessError } = await supabaseClient
      .from('work_happiness')
      .insert({
        framework_id: framework.id,
        user_email: user_email, // Add for easy lookup
        impact_current: workHappiness.impact_current,
        impact_desired: workHappiness.impact_desired,
        fun_current: workHappiness.fun_current,
        fun_desired: workHappiness.fun_desired,
        money_current: workHappiness.money_current,
        money_desired: workHappiness.money_desired,
        remote_current: workHappiness.remote_current,
        remote_desired: workHappiness.remote_desired
      })

    if (happinessError) {
      console.error('❌ Work happiness error:', happinessError)
      throw happinessError
    }

    console.log('✅ Work happiness metrics created')

    return new Response(
      JSON.stringify({
        success: true,
        framework_id: framework.id,
        message: '6 Pillars of Life™ framework created successfully!',
        data: {
          userEmail: user_email,
          frameworkCompleted: true,
          frameworkId: framework.id,
          elementsCount: Object.keys(circleAllocations).length,
          storageMethod: 'proper_framework_tables'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Framework saving failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
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