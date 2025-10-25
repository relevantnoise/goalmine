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
      circleData 
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

    // 4. Return success with analysis
    return new Response(
      JSON.stringify({ 
        success: true,
        framework_id: framework.id,
        analysis: {
          total_ideal_time: totalIdealTime,
          available_time: lifeContext.total_available_hours_per_week,
          has_time_conflict: timeConflict,
          circles_created: profiles.length
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