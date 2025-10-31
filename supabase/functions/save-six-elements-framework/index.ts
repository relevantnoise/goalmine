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
    console.log('📋 Elements Data received:', JSON.stringify(elementsData, null, 2))
    console.log('💼 Work Happiness Data received:', JSON.stringify(workHappinessData, null, 2))
    
    // CRITICAL: Check if we have the expected data structure
    if (!elementsData || Object.keys(elementsData).length === 0) {
      throw new Error('Elements data is empty or missing')
    }
    
    if (!workHappinessData || Object.keys(workHappinessData).length === 0) {
      throw new Error('Work happiness data is empty or missing')
    }

    // Get the user ID from profiles table - use the 'id' column which contains Firebase UID
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (profileError || !profile?.id) {
      throw new Error(`User profile not found for ${userEmail}`)
    }

    const userId = profile.id;
    console.log('🆔 Using Firebase UID as user_id:', userId);

    // Save to proper framework tables - NOT goals table
    console.log('📋 Creating framework instance in user_frameworks...')
    
    // Create framework instance
    const { data: framework, error: frameworkError } = await supabaseClient
      .from('user_frameworks')
      .insert({
        user_id: userId,
        user_email: userEmail,
        onboarding_completed: true,
        is_active: true
      })
      .select()
      .single()

    if (frameworkError) {
      console.error('Error creating framework:', frameworkError)
      throw new Error(`Failed to create framework: ${frameworkError.message}`)
    }

    console.log('✅ Framework instance created:', framework.id)
    
    if (!framework.id) {
      throw new Error('Framework creation failed - no ID returned')
    }

    // Save individual pillars with correct field names
    console.log('📝 Saving pillar assessments...')
    const pillarInserts = Object.entries(elementsData).map(([pillarName, data]: [string, any]) => ({
      framework_id: framework.id,
      pillar_name: pillarName,
      importance_level: data.importance_level || 5,
      current_hours_per_week: data.current_hours_per_week || 0,
      ideal_hours_per_week: data.ideal_hours_per_week || 0
    }));

    console.log('🎯 Pillar inserts prepared:', JSON.stringify(pillarInserts, null, 2))

    const { data: insertedElements, error: elementsError } = await supabaseClient
      .from('pillar_assessments')
      .insert(pillarInserts)
      .select();

    if (elementsError) {
      console.error('❌ Error saving elements:', elementsError)
      throw new Error(`Failed to save elements: ${elementsError.message}`)
    }

    console.log('✅ Elements saved successfully:', insertedElements?.length || 0, 'elements')

    // Save work happiness data with correct field names
    console.log('💼 Saving work happiness data...')
    const workHappinessInsert = {
      framework_id: framework.id,
      user_email: userEmail,
      impact_current: workHappinessData.impact_current,
      impact_desired: workHappinessData.impact_desired,
      enjoyment_current: workHappinessData.enjoyment_current,
      enjoyment_desired: workHappinessData.enjoyment_desired,
      income_current: workHappinessData.income_current,
      income_desired: workHappinessData.income_desired,
      remote_current: workHappinessData.remote_current,
      remote_desired: workHappinessData.remote_desired
    };

    console.log('💰 Work happiness insert prepared:', JSON.stringify(workHappinessInsert, null, 2))

    const { data: insertedWorkHappiness, error: workError } = await supabaseClient
      .from('work_happiness')
      .insert(workHappinessInsert)
      .select();

    if (workError) {
      console.error('❌ Error saving work happiness:', workError)
      throw new Error(`Failed to save work happiness: ${workError.message}`)
    }

    console.log('✅ Work happiness saved successfully:', insertedWorkHappiness?.length || 0, 'records')

    // 🧠 ENTERPRISE AI STRATEGIC INTELLIGENCE: Generate AI insights after assessment completion
    console.log('🧠 Triggering Enterprise AI Strategic Intelligence generation...')
    try {
      const { data: aiResult, error: aiError } = await supabaseClient.functions.invoke('generate-ai-insights', {
        body: {
          userEmail: userEmail,
          frameworkId: framework.id
        }
      });
      
      if (aiError) {
        console.error('⚠️ AI insights generation failed (non-critical):', aiError);
      } else {
        console.log('✅ Enterprise AI Strategic Intelligence generated successfully!');
        console.log('🔍 AI Insights Result:', aiResult);
      }
    } catch (aiGenerationError) {
      console.error('⚠️ AI insights generation error (non-critical):', aiGenerationError);
    }

    console.log('✅ Framework assessment saved to proper tables')
    const profileResult = framework

    return new Response(
      JSON.stringify({
        success: true,
        message: "6 Elements of Life™ framework saved successfully!",
        data: {
          userEmail,
          frameworkCompleted: true,
          frameworkId: profileResult?.id,
          elementsCount: Object.keys(elementsData).length,
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