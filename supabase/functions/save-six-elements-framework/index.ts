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

    console.log('🚀 Saving Six Elements of Life framework...')
    
    // Parse request body
    const { userEmail, elementsData, workHappinessData } = await req.json()
    
    if (!userEmail || !elementsData || !workHappinessData) {
      throw new Error('Missing required fields: userEmail, elementsData, workHappinessData')
    }

    console.log('📊 Processing framework for user:', userEmail)

    // Store framework data as JSON in a flexible way
    // This leverages the existing table structure that we know works
    const frameworkJson = JSON.stringify({
      completed_at: new Date().toISOString(),
      elements: elementsData,
      work_happiness: workHappinessData,
      version: '1.0'
    })

    // First, check if user profile exists
    let { data: existingProfile, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError)
      throw new Error('Failed to fetch user profile')
    }

    let profileResult

    // First create the framework summary goal
    console.log('📋 Creating framework summary goal...')
    const { data: frameworkGoal, error: goalError } = await supabaseClient
      .from('goals')
      .insert({
        user_id: userEmail,
        title: "🎯 6 Elements of Life™ Framework Complete",
        description: `Your personalized life management system: ${Object.keys(elementsData).length} elements configured with business happiness assessment`,
        tone: "wise_mentor",
        target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time_of_day: "07:00",
        is_active: true
      })
      .select()
      .single()

    if (goalError) {
      console.error('Error creating framework goal:', goalError)
      throw new Error(`Failed to create framework goal: ${goalError.message}`)
    }

    console.log('✅ Framework summary goal created:', frameworkGoal.id)

    // Now store the detailed framework data in motivation_history using the real goal ID
    console.log('📝 Storing framework data in motivation_history...')
    
    const { data: motivationRecord, error: motivationError } = await supabaseClient
      .from('motivation_history')
      .insert({
        goal_id: frameworkGoal.id, // Use the real goal ID
        user_id: userEmail, // This will work since it was changed to TEXT
        message: "6 Elements of Life™ Framework Completed",
        micro_plan: frameworkJson, // Store the full framework data here as JSON
        challenge: "Framework assessment completed successfully",
        tone: 'wise_mentor'
      })
      .select()
      .single()

    if (motivationError) {
      console.error('Error storing framework data:', motivationError)
      throw new Error(`Failed to store framework data: ${motivationError.message}`)
    }

    console.log('✅ Framework data stored successfully:', motivationRecord.id)
    profileResult = motivationRecord

    return new Response(
      JSON.stringify({
        success: true,
        message: "6 Elements of Life™ framework saved successfully!",
        data: {
          userEmail,
          frameworkCompleted: true,
          profileId: profileResult?.id,
          frameworkGoalId: frameworkGoal?.id,
          storageMethod: 'profiles_table_json'
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