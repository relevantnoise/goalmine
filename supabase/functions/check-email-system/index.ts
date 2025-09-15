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

    console.log('=== EMAIL SYSTEM DIAGNOSTIC ===')
    
    // Check goals for both users
    const testUsers = ['danlynn@gmail.com', 'dandlynn@yahoo.com']
    
    const results = {
      timestamp: new Date().toISOString(),
      environment_info: {
        supabase_url: Deno.env.get('SUPABASE_URL'),
        has_resend_key: !!Deno.env.get('RESEND_API_KEY')
      },
      users: {}
    }

    for (const userId of testUsers) {
      console.log(`\n--- Checking user: ${userId} ---`)
      
      // Get profile
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('email', userId)
        .single()

      // Get subscription 
      const { data: subscription } = await supabaseClient
        .from('subscribers')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Get goals by email
      const { data: goalsByEmail } = await supabaseClient
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      // Get goals by profile ID (if profile exists)
      let goalsByProfileId = []
      if (profile?.id) {
        const { data } = await supabaseClient
          .from('goals')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_active', true)
        goalsByProfileId = data || []
      }

      // Check recent motivation history
      const allGoals = [...(goalsByEmail || []), ...goalsByProfileId]
      let motivationHistory = []
      
      if (allGoals.length > 0) {
        const goalIds = allGoals.map(g => g.id)
        const { data: history } = await supabaseClient
          .from('motivation_history')
          .select('*')
          .in('goal_id', goalIds)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
        motivationHistory = history || []
      }

      results.users[userId] = {
        profile: profile || null,
        subscription: subscription || null,
        goals_by_email: goalsByEmail || [],
        goals_by_profile_id: goalsByProfileId || [],
        total_active_goals: (goalsByEmail?.length || 0) + (goalsByProfileId?.length || 0),
        recent_motivation_history: motivationHistory,
        email_eligibility: {
          has_active_goals: ((goalsByEmail?.length || 0) + (goalsByProfileId?.length || 0)) > 0,
          is_subscribed: subscription?.subscribed === true,
          trial_active: profile && profile.trial_expires_at ? new Date(profile.trial_expires_at) > new Date() : false,
          should_receive_emails: false
        }
      }

      // Determine email eligibility
      const userResult = results.users[userId]
      const hasActiveGoals = userResult.email_eligibility.has_active_goals
      const isSubscribed = userResult.email_eligibility.is_subscribed
      const trialActive = userResult.email_eligibility.trial_active
      
      userResult.email_eligibility.should_receive_emails = hasActiveGoals && (isSubscribed || trialActive)

      console.log(`User ${userId}:`)
      console.log(`- Profile: ${profile ? 'EXISTS' : 'NOT FOUND'}`)
      console.log(`- Subscription: ${subscription ? 'EXISTS' : 'NOT FOUND'}`)
      console.log(`- Active Goals: ${userResult.total_active_goals}`)
      console.log(`- Should Receive Emails: ${userResult.email_eligibility.should_receive_emails}`)
    }

    return new Response(
      JSON.stringify(results, null, 2),
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