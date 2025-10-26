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

    console.log('🎯 Creating simple circle framework for:', user_email)

    // 1. Create the main framework record
    const { data: framework, error: frameworkError } = await supabaseClient
      .from('user_circle_frameworks')
      .insert({
        user_email,
        work_hours_per_week: timeContext.work_hours_per_week,
        sleep_hours_per_night: timeContext.sleep_hours_per_night,
        commute_hours_per_week: timeContext.commute_hours_per_week,
        available_hours_per_week: timeContext.available_hours_per_week
      })
      .select()
      .single()

    if (frameworkError) {
      console.error('❌ Framework creation error:', frameworkError)
      throw frameworkError
    }

    console.log('✅ Framework created:', framework.id)

    // 2. Create circle allocations
    const circleData = Object.values(circleAllocations).map(allocation => ({
      framework_id: framework.id,
      circle_name: allocation.circle_name,
      importance_level: allocation.importance_level,
      current_hours_per_week: allocation.current_hours_per_week,
      ideal_hours_per_week: allocation.ideal_hours_per_week
    }))

    if (circleData.length > 0) {
      const { error: circleError } = await supabaseClient
        .from('circle_time_allocations')
        .insert(circleData)

      if (circleError) {
        console.error('❌ Circle allocation error:', circleError)
        throw circleError
      }

      console.log('✅ Circle allocations created:', circleData.length)
    }

    // 3. Create work happiness metrics
    const { error: happinessError } = await supabaseClient
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
        message: 'Simple circle framework created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})