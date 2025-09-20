import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

    const { userEmail } = await req.json()
    const targetUser = userEmail || 'danlynn@gmail.com'

    console.log(`Resetting last_motivation_date for user: ${targetUser}`)

    // Find goals for this user (try both email and Firebase UID approaches)
    const { data: goalsByEmail } = await supabaseClient
      .from('goals')
      .select('*')
      .eq('user_id', targetUser)
      .eq('is_active', true)

    // Also try to find by Firebase UID if email lookup didn't work
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', targetUser)
      .single()

    let goalsByProfileId = []
    if (profile?.id) {
      const { data } = await supabaseClient
        .from('goals')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true)
      goalsByProfileId = data || []
    }

    const allGoals = [...(goalsByEmail || []), ...goalsByProfileId]
    
    if (allGoals.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `No active goals found for ${targetUser}`,
          searched: { email: targetUser, profileId: profile?.id || 'none' }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        },
      )
    }

    console.log(`Found ${allGoals.length} goals for ${targetUser}`)

    // Reset last_motivation_date to yesterday so emails will send today
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayString = yesterday.toISOString().split('T')[0]

    const goalIds = allGoals.map(g => g.id)
    const { error: updateError } = await supabaseClient
      .from('goals')
      .update({ last_motivation_date: yesterdayString })
      .in('id', goalIds)

    if (updateError) {
      console.error('Error resetting dates:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reset last_motivation_date to ${yesterdayString} for ${allGoals.length} goals belonging to ${targetUser}`,
        goals: allGoals.map(g => ({ id: g.id, title: g.title, user_id: g.user_id })),
        resetDate: yesterdayString
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
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