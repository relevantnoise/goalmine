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
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userEmail, frameworkId, elementsData, workHappinessData } = await req.json()
    
    if (!userEmail || !frameworkId) {
      throw new Error('Missing required fields: userEmail, frameworkId')
    }

    console.log('📝 Updating Six Elements framework:', frameworkId)

    // Verify framework belongs to user
    const { data: framework, error: frameworkError } = await supabaseClient
      .from('six_elements_frameworks')
      .select('*')
      .eq('id', frameworkId)
      .eq('user_email', userEmail)
      .single()

    if (frameworkError) {
      throw new Error(`Framework not found or access denied: ${frameworkError.message}`)
    }

    console.log('✅ Framework ownership verified')

    const updates = []

    // Update element allocations if provided
    if (elementsData) {
      console.log('📋 Updating element allocations...')
      
      for (const [elementName, data] of Object.entries(elementsData)) {
        const { error: elementError } = await supabaseClient
          .from('element_allocations')
          .update({
            importance_level: data.importance_level,
            current_hours_per_week: data.current_hours_per_week,
            ideal_hours_per_week: data.ideal_hours_per_week,
            updated_at: new Date().toISOString()
          })
          .eq('framework_id', frameworkId)
          .eq('element_name', elementName)

        if (elementError) {
          throw new Error(`Failed to update element "${elementName}": ${elementError.message}`)
        }

        console.log(`✅ Updated element: ${elementName}`)
        updates.push(`Updated ${elementName}`)
      }
    }

    // Update work happiness assessment if provided
    if (workHappinessData) {
      console.log('💼 Updating work happiness assessment...')
      
      const { error: workError } = await supabaseClient
        .from('work_happiness_assessment')
        .update({
          impact_current: workHappinessData.impact_current,
          impact_desired: workHappinessData.impact_desired,
          enjoyment_current: workHappinessData.enjoyment_current,
          enjoyment_desired: workHappinessData.enjoyment_desired,
          income_current: workHappinessData.income_current,
          income_desired: workHappinessData.income_desired,
          remote_current: workHappinessData.remote_current,
          remote_desired: workHappinessData.remote_desired,
          updated_at: new Date().toISOString()
        })
        .eq('framework_id', frameworkId)

      if (workError) {
        throw new Error(`Failed to update work happiness: ${workError.message}`)
      }

      console.log('✅ Work happiness assessment updated')
      updates.push('Updated work happiness assessment')
    }

    // Update framework timestamp
    const { error: frameworkUpdateError } = await supabaseClient
      .from('six_elements_frameworks')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', frameworkId)

    if (frameworkUpdateError) {
      console.log('⚠️ Framework timestamp update failed (non-critical):', frameworkUpdateError)
    }

    console.log('🎉 Framework update completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: "Six Elements framework updated successfully",
        data: {
          frameworkId,
          userEmail,
          updatesApplied: updates,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Framework update failed:', error)
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