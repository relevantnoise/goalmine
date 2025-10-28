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

    const { userEmail } = await req.json()
    
    if (!userEmail) {
      throw new Error('Missing required field: userEmail')
    }

    console.log('📊 Fetching Six Elements framework for user:', userEmail)

    // Get the most recent framework for this user
    const { data: framework, error: frameworkError } = await supabaseClient
      .from('six_elements_frameworks')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (frameworkError) {
      if (frameworkError.code === 'PGRST116') {
        // No framework found
        return new Response(
          JSON.stringify({
            success: true,
            hasFramework: false,
            message: 'No Six Elements framework found for user'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
      throw new Error(`Failed to fetch framework: ${frameworkError.message}`)
    }

    console.log('✅ Framework found:', framework.id)

    // Get element allocations
    const { data: elements, error: elementsError } = await supabaseClient
      .from('element_allocations')
      .select('*')
      .eq('framework_id', framework.id)
      .order('element_name')

    if (elementsError) {
      throw new Error(`Failed to fetch elements: ${elementsError.message}`)
    }

    console.log('✅ Elements found:', elements.length)

    // Get work happiness assessment
    const { data: workHappiness, error: workError } = await supabaseClient
      .from('work_happiness_assessment')
      .select('*')
      .eq('framework_id', framework.id)
      .single()

    if (workError) {
      throw new Error(`Failed to fetch work happiness: ${workError.message}`)
    }

    console.log('✅ Work happiness assessment found')

    // Transform elements into the format expected by frontend
    const elementsData = {}
    elements.forEach(element => {
      elementsData[element.element_name] = {
        importance_level: element.importance_level,
        current_hours_per_week: element.current_hours_per_week,
        ideal_hours_per_week: element.ideal_hours_per_week,
        id: element.id
      }
    })

    // Calculate progress metrics
    const progressMetrics = {}
    elements.forEach(element => {
      const current = element.current_hours_per_week
      const ideal = element.ideal_hours_per_week
      const difference = current - ideal
      const percentageOfIdeal = ideal > 0 ? (current / ideal) * 100 : 0
      
      progressMetrics[element.element_name] = {
        difference: difference,
        percentageOfIdeal: Math.round(percentageOfIdeal),
        status: difference === 0 ? 'perfect' : difference > 0 ? 'over' : 'under',
        weeklyGap: Math.abs(difference)
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        hasFramework: true,
        message: "Six Elements framework retrieved successfully",
        data: {
          userEmail,
          frameworkId: framework.id,
          createdAt: framework.created_at,
          updatedAt: framework.updated_at,
          elementsData,
          workHappinessData: {
            impact_current: workHappiness.impact_current,
            impact_desired: workHappiness.impact_desired,
            enjoyment_current: workHappiness.enjoyment_current,
            enjoyment_desired: workHappiness.enjoyment_desired,
            income_current: workHappiness.income_current,
            income_desired: workHappiness.income_desired,
            remote_current: workHappiness.remote_current,
            remote_desired: workHappiness.remote_desired,
            id: workHappiness.id
          },
          progressMetrics,
          summary: {
            totalElements: elements.length,
            elementsAtIdeal: Object.values(progressMetrics).filter(p => p.status === 'perfect').length,
            elementsUnder: Object.values(progressMetrics).filter(p => p.status === 'under').length,
            elementsOver: Object.values(progressMetrics).filter(p => p.status === 'over').length
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Framework retrieval failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        hasFramework: false,
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