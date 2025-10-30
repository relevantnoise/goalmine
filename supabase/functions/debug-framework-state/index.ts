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

    // Check for Dan's data
    console.log('Checking for Dan Lynn framework data...')
    
    const { data: profiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('email', 'danlynn@gmail.com')
    
    console.log('Profile data:', profiles)

    if (profileError) {
      console.log('Profile error:', profileError)
    }

    // Check framework tables
    const { data: frameworks, error: frameworkError } = await supabaseClient
      .from('user_frameworks')
      .select('*')
      .eq('user_email', 'danlynn@gmail.com')
    
    console.log('Framework data:', frameworks)
    
    if (frameworkError) {
      console.log('Framework error:', frameworkError)
    }

    // Check for framework elements
    if (frameworks && frameworks.length > 0) {
      const { data: elements, error: elementsError } = await supabaseClient
        .from('framework_elements')
        .select('*')
        .eq('framework_id', frameworks[0].id)
      
      console.log('Elements data:', elements)
      
      if (elementsError) {
        console.log('Elements error:', elementsError)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      profiles,
      frameworks,
      message: 'Debug info logged to console'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Debug error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})