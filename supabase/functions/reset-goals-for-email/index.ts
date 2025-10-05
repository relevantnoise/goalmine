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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[RESET-GOALS] Starting goal reset process')
    
    // Get all goals first
    const { data: goals, error: fetchError } = await supabase
      .from('goals')
      .select('id, user_id, title, last_motivation_date')
    
    if (fetchError) {
      console.error('[RESET-GOALS] Error fetching goals:', fetchError)
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[RESET-GOALS] Found ${goals?.length || 0} goals`)
    
    if (!goals || goals.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No goals found to reset',
        goalsReset: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Reset each goal individually for maximum reliability
    let resetCount = 0
    let errors = 0

    for (const goal of goals) {
      try {
        const { error: updateError } = await supabase
          .from('goals')
          .update({ last_motivation_date: null })
          .eq('id', goal.id)

        if (updateError) {
          console.error(`[RESET-GOALS] Failed to reset goal ${goal.id}:`, updateError)
          errors++
        } else {
          console.log(`[RESET-GOALS] Reset goal ${goal.id} (was: ${goal.last_motivation_date})`)
          resetCount++
        }
      } catch (error) {
        console.error(`[RESET-GOALS] Exception resetting goal ${goal.id}:`, error)
        errors++
      }
    }

    // Verify the reset worked
    const { data: verifyGoals } = await supabase
      .from('goals')
      .select('id, last_motivation_date')
      .not('last_motivation_date', 'is', null)

    const stillHaveDates = verifyGoals?.length || 0

    return new Response(JSON.stringify({
      success: true,
      message: `Reset ${resetCount} goals with ${errors} errors`,
      goalsReset: resetCount,
      errors,
      totalGoals: goals.length,
      stillHaveDates,
      verification: stillHaveDates === 0 ? 'SUCCESS' : 'SOME_GOALS_STILL_HAVE_DATES'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[RESET-GOALS] Fatal error:', error)
    return new Response(JSON.stringify({ 
      error: 'Fatal error in reset function',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})