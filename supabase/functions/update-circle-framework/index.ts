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

    if (!user_email) {
      throw new Error('User email is required')
    }

    console.log('💾 Updating circle framework for:', user_email)

    // First, get the existing framework
    const { data: existingFramework, error: fetchError } = await supabaseClient
      .from('user_circle_frameworks')
      .select('*')
      .eq('user_email', user_email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error('❌ Error fetching existing framework:', fetchError)
      throw fetchError
    }

    if (!existingFramework) {
      throw new Error('No existing framework found for this user')
    }

    console.log('📝 Found existing framework:', existingFramework.id)

    // Update the main framework record
    const { error: updateFrameworkError } = await supabaseClient
      .from('user_circle_frameworks')
      .update({
        work_hours_per_week: timeContext.work_hours_per_week,
        sleep_hours_per_night: timeContext.sleep_hours_per_night,
        commute_hours_per_week: timeContext.commute_hours_per_week,
        available_hours_per_week: timeContext.available_hours_per_week,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingFramework.id)

    if (updateFrameworkError) {
      console.error('❌ Error updating framework:', updateFrameworkError)
      throw updateFrameworkError
    }

    console.log('✅ Framework basic data updated')

    // Update circle allocations
    for (const allocation of circleAllocations) {
      const { error: allocError } = await supabaseClient
        .from('circle_time_allocations')
        .upsert({
          framework_id: existingFramework.id,
          circle_name: allocation.circle_name,
          importance_level: allocation.importance_level,
          current_hours_per_week: allocation.current_hours_per_week,
          ideal_hours_per_week: allocation.ideal_hours_per_week,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'framework_id,circle_name'
        })

      if (allocError) {
        console.error('❌ Error updating allocation for', allocation.circle_name, allocError)
        throw allocError
      }
    }

    console.log('✅ Circle allocations updated')

    // Update work happiness metrics
    const { error: happinessError } = await supabaseClient
      .from('work_happiness_metrics')
      .upsert({
        framework_id: existingFramework.id,
        impact_current: workHappiness.impact_current,
        impact_desired: workHappiness.impact_desired,
        fun_current: workHappiness.fun_current,
        fun_desired: workHappiness.fun_desired,
        money_current: workHappiness.money_current,
        money_desired: workHappiness.money_desired,
        remote_current: workHappiness.remote_current,
        remote_desired: workHappiness.remote_desired,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'framework_id'
      })

    if (happinessError) {
      console.error('❌ Error updating work happiness metrics:', happinessError)
      throw happinessError
    }

    console.log('✅ Work happiness metrics updated')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Framework updated successfully',
        framework_id: existingFramework.id
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
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})