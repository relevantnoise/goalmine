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
    const { user_email, timeContext, circleAllocations, workHappiness } = await req.json()

    console.log('🔥 BULLETPROOF: Creating framework for:', user_email)
    console.log('📊 Data received:', { timeContext, circleAllocations, workHappiness })

    // Get database connection info from environment
    const dbUrl = Deno.env.get('SUPABASE_DB_URL') || Deno.env.get('DATABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('🔧 Environment check:', {
      hasDbUrl: !!dbUrl,
      hasServiceKey: !!serviceKey,
      supabaseUrl: Deno.env.get('SUPABASE_URL')
    })

    // Use direct PostgreSQL connection or HTTP API calls
    const supabaseUrl = Deno.env.get('SUPABASE_URL') + '/rest/v1/'
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Prefer': 'return=representation'
    }

    // 1. Create framework record via REST API
    console.log('📝 Step 1: Creating framework record...')
    const frameworkResponse = await fetch(supabaseUrl + 'user_circle_frameworks', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_email,
        work_hours_per_week: timeContext.work_hours_per_week,
        sleep_hours_per_night: timeContext.sleep_hours_per_night,
        commute_hours_per_week: timeContext.commute_hours_per_week,
        available_hours_per_week: timeContext.available_hours_per_week
      })
    })

    if (!frameworkResponse.ok) {
      const errorText = await frameworkResponse.text()
      console.error('❌ Framework creation failed:', errorText)
      throw new Error(`Framework creation failed: ${errorText}`)
    }

    const frameworks = await frameworkResponse.json()
    const framework = frameworks[0]
    
    console.log('✅ Framework created:', framework.id)

    // 2. Create circle allocations
    console.log('📝 Step 2: Creating circle allocations...')
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

    console.log('✅ Circle allocations created:', circleInserts.length)

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

    console.log('🎯 FRAMEWORK CREATION COMPLETE!')

    return new Response(
      JSON.stringify({
        success: true,
        framework_id: framework.id,
        message: 'Circle framework created successfully with bulletproof method!',
        method: 'direct_rest_api'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 BULLETPROOF FUNCTION ERROR:', error)
    console.error('💥 Error details:', error.message)
    console.error('💥 Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Bulletproof framework creation failed',
        method: 'direct_rest_api',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})