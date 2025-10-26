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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_email, framework_id, week_date, circle_data } = await req.json()

    if (!user_email || !framework_id || !week_date || !circle_data) {
      throw new Error('Missing required fields')
    }

    console.log('💾 Saving circle check-in for:', user_email, 'Week:', week_date)

    // First, check if check-in already exists for this week
    const { data: existingCheckins, error: checkError } = await supabaseClient
      .from('circle_checkins')
      .select('*')
      .eq('framework_id', framework_id)
      .eq('week_date', week_date)

    if (checkError) {
      console.error('❌ Error checking existing check-ins:', checkError)
      throw checkError
    }

    // Delete existing check-ins for this week (we'll replace them)
    if (existingCheckins && existingCheckins.length > 0) {
      console.log('🔄 Replacing existing check-ins for week:', week_date)
      const { error: deleteError } = await supabaseClient
        .from('circle_checkins')
        .delete()
        .eq('framework_id', framework_id)
        .eq('week_date', week_date)

      if (deleteError) {
        console.error('❌ Error deleting existing check-ins:', deleteError)
        throw deleteError
      }
    }

    // Save new check-ins for each circle
    const checkinRecords = circle_data.map((circle: any) => ({
      framework_id,
      week_date,
      circle_name: circle.circle_name,
      actual_hours_spent: circle.actual_hours,
      satisfaction_rating: Math.round((circle.percentage / 100) * 10), // Convert percentage to 1-10 rating
      created_at: new Date().toISOString()
    }))

    const { data: savedCheckins, error: saveError } = await supabaseClient
      .from('circle_checkins')
      .insert(checkinRecords)
      .select()

    if (saveError) {
      console.error('❌ Error saving circle check-ins:', saveError)
      throw saveError
    }

    console.log('✅ Circle check-ins saved successfully:', savedCheckins.length, 'records')

    // Calculate weekly summary stats
    const totalIdealHours = circle_data.reduce((sum: number, circle: any) => sum + circle.ideal_hours, 0)
    const totalActualHours = circle_data.reduce((sum: number, circle: any) => sum + circle.actual_hours, 0)
    const overallBalance = totalIdealHours > 0 ? Math.round((totalActualHours / totalIdealHours) * 100) : 100
    
    const balancedCircles = circle_data.filter((circle: any) => circle.status === 'balanced').length
    const underCircles = circle_data.filter((circle: any) => circle.status === 'under').length
    const overCircles = circle_data.filter((circle: any) => circle.status === 'over').length

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Circle check-in saved successfully',
        data: {
          week_date,
          records_saved: savedCheckins.length,
          summary: {
            overall_balance: overallBalance,
            total_actual_hours: totalActualHours,
            total_ideal_hours: totalIdealHours,
            balanced_circles: balancedCircles,
            under_circles: underCircles,
            over_circles: overCircles
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})