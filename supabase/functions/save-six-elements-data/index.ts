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

    console.log('🚀 Saving Six Elements of Life framework to proper database tables...')
    
    // Parse request body
    const { userEmail, elementsData, workHappinessData } = await req.json()
    
    if (!userEmail || !elementsData || !workHappinessData) {
      throw new Error('Missing required fields: userEmail, elementsData, workHappinessData')
    }

    console.log('📊 Processing framework for user:', userEmail)
    console.log('📋 Elements received:', Object.keys(elementsData))
    console.log('💼 Work happiness data received:', Object.keys(workHappinessData))
    
    // Debug: log the actual element names being passed
    console.log('🔍 Element names in detail:', JSON.stringify(Object.keys(elementsData)))
    
    // Validate element names against database constraints
    const validElementNames = ['Work', 'Sleep', 'Friends & Family', 'Health & Fitness', 'Personal Development', 'Spiritual']
    const receivedNames = Object.keys(elementsData)
    const invalidNames = receivedNames.filter(name => !validElementNames.includes(name))
    
    if (invalidNames.length > 0) {
      console.error('❌ Invalid element names:', invalidNames)
      console.log('✅ Valid names are:', validElementNames)
      throw new Error(`Invalid element names: ${invalidNames.join(', ')}. Valid names are: ${validElementNames.join(', ')}`)
    }

    // Step 1: Create main framework record
    console.log('📝 Creating main framework record...')
    const { data: framework, error: frameworkError } = await supabaseClient
      .from('six_elements_frameworks')
      .insert({
        user_email: userEmail
      })
      .select()
      .single()

    if (frameworkError) {
      console.error('❌ Framework creation failed:', frameworkError)
      throw new Error(`Failed to create framework: ${frameworkError.message}`)
    }

    console.log('✅ Framework created with ID:', framework.id)

    // Step 2: Save element allocations (one by one to identify problematic element)
    console.log('📋 Saving element allocations...')
    const elements = []
    
    for (const [elementName, data] of Object.entries(elementsData)) {
      console.log(`🔍 Attempting to save element: "${elementName}"`)
      console.log(`📊 Data:`, JSON.stringify(data))
      
      try {
        const { data: element, error: elementError } = await supabaseClient
          .from('element_allocations')
          .insert({
            framework_id: framework.id,
            element_name: elementName,
            importance_level: data.importance_level,
            current_hours_per_week: data.current_hours_per_week,
            ideal_hours_per_week: data.ideal_hours_per_week
          })
          .select()
          .single()

        if (elementError) {
          console.error(`❌ Failed to save element "${elementName}":`, elementError)
          throw new Error(`Failed to save element "${elementName}": ${elementError.message}`)
        }

        console.log(`✅ Saved element "${elementName}" with ID:`, element.id)
        elements.push(element)
      } catch (err) {
        console.error(`💥 Exception saving element "${elementName}":`, err)
        throw err
      }
    }

    console.log('✅ Saved', elements.length, 'element allocations total')

    // Step 3: Save work happiness assessment
    console.log('💼 Saving work happiness assessment...')
    const { data: workHappiness, error: workError } = await supabaseClient
      .from('work_happiness_assessment')
      .insert({
        framework_id: framework.id,
        impact_current: workHappinessData.impact_current,
        impact_desired: workHappinessData.impact_desired,
        enjoyment_current: workHappinessData.enjoyment_current,
        enjoyment_desired: workHappinessData.enjoyment_desired,
        income_current: workHappinessData.income_current,
        income_desired: workHappinessData.income_desired,
        remote_current: workHappinessData.remote_current,
        remote_desired: workHappinessData.remote_desired
      })
      .select()
      .single()

    if (workError) {
      console.error('❌ Work happiness assessment failed:', workError)
      throw new Error(`Failed to save work happiness: ${workError.message}`)
    }

    console.log('✅ Work happiness assessment saved with ID:', workHappiness.id)

    // Step 4: Create summary goal for easy access
    console.log('🎯 Creating framework summary goal...')
    const { data: summaryGoal, error: goalError } = await supabaseClient
      .from('goals')
      .insert({
        user_id: userEmail,
        title: "🎯 6 Elements of Life™ Framework Complete",
        description: `Your personalized life management system is now configured with ${Object.keys(elementsData).length} elements and business happiness metrics.`,
        tone: "wise_mentor",
        target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time_of_day: "07:00",
        element_type: "Personal Development",
        is_active: true
      })
      .select()
      .single()

    if (goalError) {
      console.log('⚠️ Summary goal creation failed (non-critical):', goalError)
    } else {
      console.log('✅ Summary goal created with ID:', summaryGoal.id)
    }

    console.log('🎉 Six Elements framework saved successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: "6 Elements of Life™ framework saved successfully!",
        data: {
          userEmail,
          frameworkId: framework.id,
          elementsCount: elements.length,
          workHappinessId: workHappiness.id,
          summaryGoalId: summaryGoal?.id,
          storageMethod: 'proper_database_tables'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Six Elements framework saving failed:', error)
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