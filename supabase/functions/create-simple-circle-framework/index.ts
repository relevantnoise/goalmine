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

    // 1. Create the main framework record using raw SQL to bypass schema cache
    const { data: frameworkResult, error: frameworkError } = await supabaseClient
      .rpc('exec_sql', {
        sql: `
          INSERT INTO user_circle_frameworks (
            user_email, 
            work_hours_per_week, 
            sleep_hours_per_night, 
            commute_hours_per_week, 
            available_hours_per_week
          ) VALUES (
            '${user_email}', 
            ${timeContext.work_hours_per_week}, 
            ${timeContext.sleep_hours_per_night}, 
            ${timeContext.commute_hours_per_week}, 
            ${timeContext.available_hours_per_week}
          ) RETURNING id;
        `
      })

    if (frameworkError) {
      console.error('❌ Framework creation error:', frameworkError)
      throw frameworkError
    }

    const framework = { id: frameworkResult[0]?.id }

    console.log('✅ Framework created:', framework.id)

    // 2. Create circle allocations using raw SQL
    const circleInserts = Object.values(circleAllocations).map(allocation => 
      `('${framework.id}', '${allocation.circle_name}', ${allocation.importance_level}, ${allocation.current_hours_per_week}, ${allocation.ideal_hours_per_week})`
    ).join(', ')

    if (circleInserts) {
      const { error: circleError } = await supabaseClient
        .rpc('exec_sql', {
          sql: `
            INSERT INTO circle_time_allocations (
              framework_id, 
              circle_name, 
              importance_level, 
              current_hours_per_week, 
              ideal_hours_per_week
            ) VALUES ${circleInserts};
          `
        })

      if (circleError) {
        console.error('❌ Circle allocation error:', circleError)
        throw circleError
      }

      console.log('✅ Circle allocations created:', Object.keys(circleAllocations).length)
    }

    // 3. Create work happiness metrics using raw SQL
    const { error: happinessError } = await supabaseClient
      .rpc('exec_sql', {
        sql: `
          INSERT INTO work_happiness_metrics (
            framework_id,
            impact_current,
            impact_desired,
            fun_current,
            fun_desired,
            money_current,
            money_desired,
            remote_current,
            remote_desired
          ) VALUES (
            '${framework.id}',
            ${workHappiness.impact_current},
            ${workHappiness.impact_desired},
            ${workHappiness.fun_current},
            ${workHappiness.fun_desired},
            ${workHappiness.money_current},
            ${workHappiness.money_desired},
            ${workHappiness.remote_current},
            ${workHappiness.remote_desired}
          );
        `
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