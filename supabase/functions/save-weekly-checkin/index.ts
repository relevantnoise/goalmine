import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, week_ending, element_scores, notes, overall_satisfaction } = await req.json()

    if (!user_id || !week_ending || !element_scores) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log('📊 Saving weekly check-in:', { user_id, week_ending, element_scores, overall_satisfaction })

    // First, get or create user framework
    let { data: framework, error: frameworkError } = await supabaseAdmin
      .from('user_frameworks')
      .select('id')
      .eq('user_id', user_id)
      .single()

    if (frameworkError || !framework) {
      // Create framework if it doesn't exist
      const { data: newFramework, error: createError } = await supabaseAdmin
        .from('user_frameworks')
        .insert({
          user_id,
          is_active: true,
          onboarding_completed: true
        })
        .select('id')
        .single()

      if (createError) {
        console.error('❌ Failed to create framework:', createError)
        throw createError
      }
      framework = newFramework
    }

    // Save weekly check-in
    const { data: checkin, error: checkinError } = await supabaseAdmin
      .from('weekly_checkins')
      .upsert({
        framework_id: framework.id,
        week_ending,
        element_scores,
        overall_satisfaction,
        notes
      })
      .select()
      .single()

    if (checkinError) {
      console.error('❌ Failed to save check-in:', checkinError)
      throw checkinError
    }

    // Update framework last check-in date and count
    const { error: updateError } = await supabaseAdmin
      .from('user_frameworks')
      .update({
        last_checkin_date: week_ending,
        total_checkins: supabaseAdmin.rpc('increment', { x: 1 }),
        last_updated: new Date().toISOString()
      })
      .eq('id', framework.id)

    if (updateError) {
      console.error('❌ Failed to update framework:', updateError)
      // Don't throw - check-in was saved successfully
    }

    console.log('✅ Weekly check-in saved successfully')

    return new Response(JSON.stringify({ 
      success: true,
      checkin_id: checkin.id,
      message: 'Weekly check-in saved successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('🚨 Error saving weekly check-in:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})