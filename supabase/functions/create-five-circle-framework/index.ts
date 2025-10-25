import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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

    const { 
      user_id, // This is the email from frontend
      lifeContext,
      circleData,
      conversationHistory = null
    } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating 5 Circle framework for user:', user_id)
    
    // Get the user's Firebase UID from their profile (user_id is email from frontend)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', user_id)
      .single()
    
    if (profileError || !profile) {
      console.error('Error getting user profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const firebaseUid = profile.id
    console.log('Found Firebase UID for user:', firebaseUid)

    // 1. Create the main framework record
    const { data: framework, error: frameworkError } = await supabaseClient
      .from('circle_frameworks')
      .insert({
        user_id: firebaseUid, // Use Firebase UID
        life_stage: lifeContext.life_stage,
        primary_challenge: lifeContext.primary_challenge,
        primary_90_day_priority: lifeContext.primary_90_day_priority,
        total_available_hours_per_week: lifeContext.total_available_hours_per_week,
        work_hours_per_week: lifeContext.work_hours_per_week,
        sleep_hours_per_night: lifeContext.sleep_hours_per_night,
        commute_hours_per_week: lifeContext.commute_hours_per_week,
        interview_completed: true
      })
      .select()
      .single()

    if (frameworkError) {
      console.error('Error creating framework:', frameworkError)
      throw frameworkError
    }

    console.log('Framework created:', framework.id)

    // 2. Create circle profiles for each circle
    const circleProfiles = Object.entries(circleData).map(([circleName, data]: [string, any]) => ({
      framework_id: framework.id,
      user_id: firebaseUid, // Use Firebase UID
      circle_name: circleName,
      personal_definition: data.personal_definition,
      importance_level: data.importance_level,
      current_satisfaction: data.current_satisfaction,
      current_time_per_week: data.current_time_per_week,
      ideal_time_per_week: data.ideal_time_per_week,
      success_definition_90_days: data.success_definition_90_days
    }))

    const { data: profiles, error: profilesError } = await supabaseClient
      .from('circle_profiles')
      .insert(circleProfiles)
      .select()

    if (profilesError) {
      console.error('Error creating circle profiles:', profilesError)
      throw profilesError
    }

    console.log('Circle profiles created:', profiles.length)

    // 3. Calculate total time allocation and detect conflicts
    const totalIdealTime = Object.values(circleData).reduce((sum: number, circle: any) => 
      sum + (circle.ideal_time_per_week || 0), 0
    )

    const timeConflict = totalIdealTime > lifeContext.total_available_hours_per_week

    // 4. Generate AI consultant analysis report
    let consultantReport = null
    
    if (Deno.env.get('OPENAI_API_KEY')) {
      try {
        const analysisPrompt = `As Dan Lynn, a management consultant with 30 years of experience, provide a comprehensive analysis of this client's 5 Circle Framework™ setup:

LIFE CONTEXT:
- Challenge: ${lifeContext.primary_challenge}
- 90-Day Priority: ${lifeContext.primary_90_day_priority}
- Available Time: ${lifeContext.total_available_hours_per_week} hours/week
- Work Hours: ${lifeContext.work_hours_per_week} hours/week

CIRCLE DATA:
${Object.entries(circleData).map(([name, data]: [string, any]) => `
${name.toUpperCase()}:
- Definition: ${data.personal_definition || 'Not provided'}
- Importance: ${data.importance_level}/10
- Satisfaction: ${data.current_satisfaction}/10
- Current Time: ${data.current_time_per_week}h/week
- Ideal Time: ${data.ideal_time_per_week}h/week
- 90-Day Success: ${data.success_definition_90_days || 'Not provided'}
`).join('')}

CONVERSATION INSIGHTS:
${conversationHistory ? conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') : 'No additional conversation'}

TIME ANALYSIS: ${timeConflict ? `CONFLICT - Allocated ${totalIdealTime}h vs ${lifeContext.total_available_hours_per_week}h available` : `BALANCED - ${totalIdealTime}h allocated of ${lifeContext.total_available_hours_per_week}h available`}

Provide a professional consultant report with:
1. **Executive Summary** (2-3 sentences)
2. **Key Insights** (3-4 bullet points)
3. **Priority Recommendations** (3 specific actions)
4. **Time Optimization Strategy** (if needed)
5. **Success Probability Assessment** (High/Medium/Low with reasoning)

Keep it concise but insightful, like a $2000/hour consultant would deliver.`

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { 
                role: 'system', 
                content: 'You are Dan Lynn, a top management consultant. Provide actionable, professional analysis in a warm but direct tone.' 
              },
              { role: 'user', content: analysisPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
          })
        })

        const aiResult = await openaiResponse.json()
        consultantReport = aiResult.choices[0].message.content

        console.log('✅ Generated consultant report')
      } catch (error) {
        console.error('❌ Failed to generate consultant report:', error)
        // Continue without report - not critical
      }
    }

    // 5. Return success with comprehensive analysis
    return new Response(
      JSON.stringify({ 
        success: true,
        framework_id: framework.id,
        analysis: {
          total_ideal_time: totalIdealTime,
          available_time: lifeContext.total_available_hours_per_week,
          has_time_conflict: timeConflict,
          circles_created: profiles.length,
          consultant_report: consultantReport
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-five-circle-framework:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create 5 Circle framework',
        details: error 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})