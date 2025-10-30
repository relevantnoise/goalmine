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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔍 Testing framework tables...')

    // Test user_frameworks table
    const { data: frameworks, error: frameworksError } = await supabase
      .from('user_frameworks')
      .select('*')
      .limit(1)
    
    console.log('user_frameworks table:', frameworks ? 'EXISTS' : 'MISSING', frameworksError?.message || '')

    // Test framework_elements table  
    const { data: elements, error: elementsError } = await supabase
      .from('framework_elements')
      .select('*')
      .limit(1)
    
    console.log('framework_elements table:', elements ? 'EXISTS' : 'MISSING', elementsError?.message || '')

    // Test work_happiness table
    const { data: happiness, error: happinessError } = await supabase
      .from('work_happiness')
      .select('*')
      .limit(1)
    
    console.log('work_happiness table:', happiness ? 'EXISTS' : 'MISSING', happinessError?.message || '')

    return new Response(
      JSON.stringify({
        success: true,
        tables: {
          user_frameworks: { exists: !frameworksError, error: frameworksError?.message },
          framework_elements: { exists: !elementsError, error: elementsError?.message },
          work_happiness: { exists: !happinessError, error: happinessError?.message }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Test error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})