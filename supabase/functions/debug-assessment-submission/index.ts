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

    console.log('🔍 Debug Assessment Submission')
    console.log('Headers:', Object.fromEntries(req.headers.entries()))
    
    const body = await req.json()
    console.log('📊 Request Body:', JSON.stringify(body, null, 2))

    // Test database connection
    const { data: profiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .limit(1)

    console.log('🔗 Database Connection Test:', { profiles, profileError })

    // Test framework tables
    const { data: frameworks, error: frameworkError } = await supabaseClient
      .from('user_frameworks')
      .select('*')
      .limit(1)

    console.log('📋 Framework Table Test:', { frameworks, frameworkError })

    // Test elements table
    const { data: elements, error: elementsError } = await supabaseClient
      .from('framework_elements')
      .select('*')
      .limit(1)

    console.log('🎯 Elements Table Test:', { elements, elementsError })

    // Test work happiness table
    const { data: workHappiness, error: workError } = await supabaseClient
      .from('work_happiness')
      .select('*')
      .limit(1)

    console.log('💼 Work Happiness Table Test:', { workHappiness, workError })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Debug complete - check logs',
        receivedData: body,
        databaseTests: {
          profiles: { count: profiles?.length || 0, error: profileError?.message },
          frameworks: { count: frameworks?.length || 0, error: frameworkError?.message },
          elements: { count: elements?.length || 0, error: elementsError?.message },
          workHappiness: { count: workHappiness?.length || 0, error: workError?.message }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Debug function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})