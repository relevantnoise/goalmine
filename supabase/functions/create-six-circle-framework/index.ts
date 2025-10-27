import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_email, circleAllocations, workHappiness } = await req.json()

    console.log('🎯 Creating 6 Circle Framework for:', user_email)

    // Get database connection info from environment
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') + '/rest/v1/'
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Prefer': 'return=representation'
    }

    // 1. Create framework record without timeContext (6 Circle Framework)
    console.log('📝 Step 1: Creating 6 Circle Framework record...')
    const frameworkResponse = await fetch(supabaseUrl + 'user_circle_frameworks', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_email,
        // No timeContext fields needed for 6 Circle Framework
        work_hours_per_week: null,
        sleep_hours_per_night: null,
        commute_hours_per_week: null,
        available_hours_per_week: null
      })
    })

    if (!frameworkResponse.ok) {
      const errorText = await frameworkResponse.text()
      console.error('❌ Framework creation failed:', errorText)
      throw new Error(`Framework creation failed: ${errorText}`)
    }

    const frameworks = await frameworkResponse.json()
    const framework = frameworks[0]
    
    console.log('✅ 6 Circle Framework created:', framework.id)

    // 2. Create circle allocations for all 6 circles
    console.log('📝 Step 2: Creating 6 circle allocations...')
    const circleInserts = Object.values(circleAllocations).map(allocation => ({
      framework_id: framework.id,
      circle_name: allocation.circle_name,
      importance_level: allocation.importance_level,
      current_hours_per_week: allocation.current_hours_per_week,
      ideal_hours_per_week: allocation.ideal_hours_per_week
    }))

    const circleResponse = await fetch(supabaseUrl + 'circle_time_allocations', {
      method: 'POST',
      headers,
      body: JSON.stringify(circleInserts)
    })

    if (!circleResponse.ok) {
      const errorText = await circleResponse.text()
      console.error('❌ Circle allocations failed:', errorText)
      throw new Error(`Circle allocations failed: ${errorText}`)
    }

    console.log('✅ 6 Circle allocations created:', circleInserts.length)

    // 3. Create work happiness metrics
    console.log('📝 Step 3: Creating work happiness metrics...')
    const happinessResponse = await fetch(supabaseUrl + 'work_happiness_metrics', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        framework_id: framework.id,
        impact_current: workHappiness.impact_current,
        impact_desired: workHappiness.impact_desired,
        fun_current: workHappiness.fun_current,
        fun_desired: workHappiness.fun_desired,
        money_current: workHappiness.money_current,
        money_desired: workHappiness.money_desired,
        remote_current: workHappiness.remote_current,
        remote_desired: workHappiness.remote_desired
      })
    })

    if (!happinessResponse.ok) {
      const errorText = await happinessResponse.text()
      console.error('❌ Work happiness failed:', errorText)
      throw new Error(`Work happiness creation failed: ${errorText}`)
    }

    console.log('✅ Work happiness metrics created')
    console.log('🎯 6 CIRCLE FRAMEWORK CREATION COMPLETE!')

    return new Response(
      JSON.stringify({
        success: true,
        framework_id: framework.id,
        message: '6 Circle Framework™ created successfully!',
        circles_count: circleInserts.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 6 CIRCLE FRAMEWORK ERROR:', error)
    console.error('💥 Error details:', error.message)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: '6 Circle Framework creation failed',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})