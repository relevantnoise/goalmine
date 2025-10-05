import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // FORCE UTC DATE - NO MORE CONFUSION
    const now = new Date()
    const utcDate = now.toISOString().split('T')[0] // This is 2025-10-05
    
    console.log(`[UTC-FIX] Current UTC time: ${now.toISOString()}`)
    console.log(`[UTC-FIX] Using UTC date: ${utcDate}`)
    console.log(`[UTC-FIX] This should be 2025-10-05, not 2025-10-04`)

    // Query goals that need processing (last_motivation_date is null OR less than today's UTC date)
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${utcDate}`)

    console.log(`[UTC-FIX] Found ${goals?.length || 0} goals that need processing`)
    
    if (error) {
      console.error('[UTC-FIX] Database error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!goals || goals.length === 0) {
      console.log(`[UTC-FIX] No goals need processing for UTC date ${utcDate}`)
      return new Response(JSON.stringify({
        success: true,
        message: `No goals need processing for UTC date ${utcDate}`,
        emailsSent: 0,
        utcDate: utcDate,
        utcTime: now.toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Process each goal
    let emailsSent = 0
    let errors = 0
    
    for (const goal of goals) {
      try {
        console.log(`[UTC-FIX] Processing goal ${goal.id} for user ${goal.user_id}`)
        
        // Mark goal as processed FIRST (atomic operation)
        const { error: updateError } = await supabase
          .from('goals')
          .update({ last_motivation_date: utcDate })
          .eq('id', goal.id)
          
        if (updateError) {
          console.error(`[UTC-FIX] Failed to mark goal ${goal.id} as processed:`, updateError)
          errors++
          continue
        }

        // Generate AI content
        const aiResponse = await fetch(`${supabaseUrl}/functions/v1/generate-daily-motivation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            goalId: goal.id,
            goalTitle: goal.title,
            goalDescription: goal.description,
            tone: goal.tone || 'encouraging',
            streakCount: goal.streak_count || 0,
            userId: goal.user_id,
            targetDate: goal.target_date
          })
        })

        const aiData = await aiResponse.json()
        
        if (!aiData.message || !aiData.microPlan || !aiData.challenge) {
          console.log(`[UTC-FIX] AI generation failed for goal ${goal.id}, using fallback`)
        }

        // Lookup user profile for email
        let userEmail = goal.user_id
        if (!goal.user_id.includes('@')) {
          // Firebase UID - need to lookup email
          const { data: profiles } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', goal.user_id)
            .limit(1)
          
          if (profiles && profiles.length > 0) {
            userEmail = profiles[0].email
          }
        }

        // Send email
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-motivation-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            name: userEmail.split('@')[0],
            goal: goal.title,
            message: aiData.message || `Daily motivation for your goal: ${goal.title}`,
            microPlan: aiData.microPlan || ['Take action on your goal', 'Track your progress', 'Stay focused'],
            challenge: aiData.challenge || 'Take one small step toward your goal right now',
            streak: goal.streak_count || 0,
            redirectUrl: 'https://goalmine.ai',
            isNudge: false,
            userId: goal.user_id,
            goalId: goal.id
          })
        })

        const emailData = await emailResponse.json()
        
        if (emailResponse.ok && emailData.success) {
          console.log(`[UTC-FIX] ✅ Email sent for goal ${goal.id} to ${userEmail}`)
          emailsSent++
        } else {
          console.error(`[UTC-FIX] ❌ Email failed for goal ${goal.id}:`, emailData.error)
          errors++
        }

      } catch (error) {
        console.error(`[UTC-FIX] Error processing goal ${goal.id}:`, error.message)
        errors++
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `UTC Fix: Processed ${goals.length} goals, sent ${emailsSent} emails`,
      emailsSent,
      errors,
      utcDate,
      utcTime: now.toISOString(),
      totalGoals: goals.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[UTC-FIX] Fatal error:', error)
    return new Response(JSON.stringify({ 
      error: 'Fatal error in UTC fix function',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})