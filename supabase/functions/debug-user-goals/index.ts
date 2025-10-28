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

    const userEmail = 'danlynn@gmail.com'

    console.log('🔍 Debugging goals for user:', userEmail)

    // Get profile
    const { data: profiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)

    console.log('👤 Profile:', profiles)

    if (profiles && profiles.length > 0) {
      const firebaseUID = profiles[0].id

      // Get ALL goals for this user (both email and Firebase UID)
      const [goalsByEmail, goalsByUID] = await Promise.all([
        supabaseClient
          .from('goals')
          .select('id, title, is_active, created_at, user_id')
          .eq('user_id', userEmail),
        supabaseClient
          .from('goals')
          .select('id, title, is_active, created_at, user_id')
          .eq('user_id', firebaseUID)
      ])

      console.log('📧 Goals by email:', goalsByEmail.data)
      console.log('🆔 Goals by Firebase UID:', goalsByUID.data)

      // Test the filtering logic
      const regularGoalsByEmail = goalsByEmail.data?.filter(g => 
        g.is_active && !g.title?.includes('6 Elements of Life™ Framework Complete')
      ) || []
      
      const regularGoalsByUID = goalsByUID.data?.filter(g => 
        g.is_active && !g.title?.includes('6 Elements of Life™ Framework Complete')
      ) || []

      console.log('🎯 Regular goals by email (active, non-framework):', regularGoalsByEmail)
      console.log('🎯 Regular goals by UID (active, non-framework):', regularGoalsByUID)

      return new Response(
        JSON.stringify({
          success: true,
          userEmail,
          firebaseUID,
          goalsByEmail: goalsByEmail.data,
          goalsByUID: goalsByUID.data,
          regularGoalsByEmail,
          regularGoalsByUID,
          totalRegularGoals: [...regularGoalsByEmail, ...regularGoalsByUID].length
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Profile not found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

  } catch (error) {
    console.error('❌ Debug error:', error)
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