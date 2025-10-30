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
    console.log('🔍 Checking data for:', userEmail)

    // Check user_frameworks
    const { data: frameworks } = await supabaseClient
      .from('user_frameworks')
      .select('*')
      .or(`user_id.eq.${userEmail},user_email.eq.${userEmail}`)

    // Check framework_elements
    let elements = []
    if (frameworks && frameworks.length > 0) {
      const { data: elementsData } = await supabaseClient
        .from('framework_elements')
        .select('*')
        .in('framework_id', frameworks.map(f => f.id))
      elements = elementsData || []
    }

    // Check work_happiness
    const { data: workHappiness } = await supabaseClient
      .from('work_happiness')
      .select('*')
      .eq('user_email', userEmail)

    return new Response(
      JSON.stringify({
        success: true,
        userEmail,
        counts: {
          frameworks: frameworks?.length || 0,
          elements: elements?.length || 0,
          workHappiness: workHappiness?.length || 0
        },
        message: 'Check user_frameworks, framework_elements, and work_happiness tables'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
