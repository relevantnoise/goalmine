import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ElementCheckinData {
  element_name: string;
  planned_hours: number;
  actual_hours: number;
  satisfaction_level: number;
  reflection_notes?: string;
  progress_status: 'on_track' | 'behind' | 'ahead' | 'need_adjustment';
}

interface WeeklySummaryData {
  overall_satisfaction: number;
  biggest_win?: string;
  biggest_challenge?: string;
  next_week_focus?: string;
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

    const { userEmail, elementCheckins, weeklySummary }: {
      userEmail: string;
      elementCheckins: ElementCheckinData[];
      weeklySummary: WeeklySummaryData;
    } = await req.json()
    
    if (!userEmail || !elementCheckins || elementCheckins.length === 0) {
      throw new Error('Missing required fields: userEmail, elementCheckins')
    }

    console.log('📊 Saving 6 Elements weekly check-in for user:', userEmail)

    // Get user's framework
    const { data: framework, error: frameworkError } = await supabaseClient
      .from('six_elements_frameworks')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (frameworkError) {
      throw new Error(`Framework not found: ${frameworkError.message}`)
    }

    // Get Monday of current week
    const getCurrentWeekMonday = () => {
      const now = new Date();
      const monday = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      return monday.toISOString().split('T')[0];
    };

    const weekDate = getCurrentWeekMonday();
    console.log('📅 Processing check-in for week:', weekDate)

    // Save element check-ins
    const checkinPromises = elementCheckins.map(async (checkin) => {
      const { error: checkinError } = await supabaseClient
        .from('six_elements_checkins')
        .upsert({
          framework_id: framework.id,
          user_email: userEmail,
          week_date: weekDate,
          element_name: checkin.element_name,
          planned_hours: checkin.planned_hours,
          actual_hours: checkin.actual_hours,
          satisfaction_level: checkin.satisfaction_level,
          reflection_notes: checkin.reflection_notes,
          progress_status: checkin.progress_status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'framework_id,week_date,element_name'
        })

      if (checkinError) {
        console.error(`Error saving ${checkin.element_name} check-in:`, checkinError)
        throw new Error(`Failed to save ${checkin.element_name} check-in: ${checkinError.message}`)
      }

      console.log(`✅ Saved ${checkin.element_name} check-in`)
    })

    await Promise.all(checkinPromises)

    // Calculate totals for weekly summary
    const totalPlannedHours = elementCheckins.reduce((sum, c) => sum + c.planned_hours, 0)
    const totalActualHours = elementCheckins.reduce((sum, c) => sum + c.actual_hours, 0)

    // Calculate balance score
    const { data: balanceScore } = await supabaseClient
      .rpc('calculate_weekly_balance_score', {
        framework_id_param: framework.id,
        week_date_param: weekDate
      })

    // Save weekly summary
    const { error: summaryError } = await supabaseClient
      .from('six_elements_weekly_summary')
      .upsert({
        framework_id: framework.id,
        user_email: userEmail,
        week_date: weekDate,
        overall_satisfaction: weeklySummary.overall_satisfaction,
        biggest_win: weeklySummary.biggest_win,
        biggest_challenge: weeklySummary.biggest_challenge,
        next_week_focus: weeklySummary.next_week_focus,
        total_planned_hours: totalPlannedHours,
        total_actual_hours: totalActualHours,
        overall_balance_score: balanceScore || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'framework_id,week_date'
      })

    if (summaryError) {
      console.error('Error saving weekly summary:', summaryError)
      throw new Error(`Failed to save weekly summary: ${summaryError.message}`)
    }

    console.log('✅ Weekly summary saved successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: "6 Elements weekly check-in saved successfully",
        data: {
          weekDate,
          elementsCheckedIn: elementCheckins.length,
          totalPlannedHours,
          totalActualHours,
          balanceScore: balanceScore || 0,
          frameworkId: framework.id
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ 6 Elements check-in failed:', error)
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